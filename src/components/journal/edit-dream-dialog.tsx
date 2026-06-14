'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { dreams } from '@/db/schema';
import { useUpdateDream } from '@/hooks/use-journal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Dream = typeof dreams.$inferSelect;

const NO_MOOD = 'none';

const buildFormSchema = (titleRequired: string, contentRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired).max(200),
    content: z.string().trim().min(1, contentRequired).max(5000),
    mood: z.string().optional(),
    tags: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

const MOODS = [
  'happy',
  'sad',
  'anxious',
  'peaceful',
  'confused',
  'excited',
  'scared',
  'neutral',
];

interface EditDreamDialogProps {
  dream: Dream;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDreamDialog({
  dream,
  open,
  onOpenChange,
}: EditDreamDialogProps) {
  const t = useTranslations('Dreams');
  const updateDream = useUpdateDream();
  const formSchema = buildFormSchema(
    t('validation.titleRequired'),
    t('validation.contentRequired')
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: dream.title,
      content: dream.content,
      mood: dream.mood || NO_MOOD,
      tags: dream.tags?.join(', ') || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: dream.title,
        content: dream.content,
        mood: dream.mood || NO_MOOD,
        tags: dream.tags?.join(', ') || '',
      });
    }
  }, [open, dream, form.reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const tags = values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      await updateDream.mutateAsync({
        id: dream.id,
        title: values.title,
        content: values.content,
        mood: values.mood && values.mood !== NO_MOOD ? values.mood : undefined,
        tags,
      });

      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to update dream:', error);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, form, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('form.edit')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.title')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.titlePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {field.value.length}/200
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.content')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.contentPlaceholder')}
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {field.value.length}/5000
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.mood')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || NO_MOOD}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.moodPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_MOOD}>
                        {t('form.moodOptional')}
                      </SelectItem>
                      {MOODS.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {t(`moods.${mood}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-muted-foreground">
                    {t('form.moodDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.tags')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.tagsPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {t('form.tagsDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateDream.isPending}
              >
                {t('form.cancel')}
              </Button>
              <Button type="submit" disabled={updateDream.isPending}>
                {updateDream.isPending ? t('form.saving') : t('form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
