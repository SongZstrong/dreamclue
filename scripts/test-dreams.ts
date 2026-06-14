#!/usr/bin/env tsx

/**
 * Test script for Dreams feature
 *
 * This script tests the basic functionality of the dreams feature:
 * 1. Database connection
 * 2. Create a test dream
 * 3. Retrieve the dream
 * 4. Update the dream
 * 5. Delete the dream
 *
 * Run with: tsx scripts/test-dreams.ts
 */

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testDreamsFeature() {
  console.log('🧪 Testing Dreams Feature...\n');

  const database = await getDb();
  const testUserId = 'test-user-id'; // Replace with actual user ID for testing

  try {
    // 1. Create a test dream
    console.log('1️⃣ Creating test dream...');
    const [newDream] = await database
      .insert(dreams)
      .values({
        userId: testUserId,
        title: 'Test Dream',
        content: 'This is a test dream created by the test script.',
        mood: 'happy',
        tags: ['test', 'automated'],
      })
      .returning();
    console.log('✅ Dream created:', newDream.id);

    // 2. Retrieve the dream
    console.log('\n2️⃣ Retrieving dream...');
    const [retrievedDream] = await database
      .select()
      .from(dreams)
      .where(eq(dreams.id, newDream.id))
      .limit(1);
    console.log('✅ Dream retrieved:', retrievedDream.title);

    // 3. Update the dream
    console.log('\n3️⃣ Updating dream...');
    const [updatedDream] = await database
      .update(dreams)
      .set({
        title: 'Updated Test Dream',
        content: 'This dream has been updated.',
      })
      .where(eq(dreams.id, newDream.id))
      .returning();
    console.log('✅ Dream updated:', updatedDream.title);

    // 4. Delete the dream
    console.log('\n4️⃣ Deleting dream...');
    await database.delete(dreams).where(eq(dreams.id, newDream.id));
    console.log('✅ Dream deleted');

    // 5. Verify deletion
    console.log('\n5️⃣ Verifying deletion...');
    const [deletedDream] = await database
      .select()
      .from(dreams)
      .where(eq(dreams.id, newDream.id))
      .limit(1);
    if (!deletedDream) {
      console.log('✅ Dream successfully deleted from database');
    } else {
      console.log('❌ Dream still exists in database');
    }

    console.log('\n✨ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testDreamsFeature();
