'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
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
import { useCreateDream } from '@/hooks/use-journal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

export function CreateDreamForm() {
  const t = useTranslations('Dreams');
  const createDream = useCreateDream();
  const [isExpanded, setIsExpanded] = useState(false);
  const formSchema = buildFormSchema(
    t('validation.titleRequired'),
    t('validation.contentRequired')
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: NO_MOOD,
      tags: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined;

    await createDream.mutateAsync({
      title: values.title,
      content: values.content,
      mood: values.mood && values.mood !== NO_MOOD ? values.mood : undefined,
      tags,
    });

    form.reset();
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsExpanded(true)} className="w-full">
            + {t('form.open')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.createTitle')}</CardTitle>
        <CardDescription>{t('form.createDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
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
                      rows={6}
                      {...field}
                    />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createDream.isPending}
                className="flex-1"
              >
                {createDream.isPending ? t('form.saving') : t('form.submit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setIsExpanded(false);
                }}
              >
                {t('form.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
