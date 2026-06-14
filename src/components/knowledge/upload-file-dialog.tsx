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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useUploadKnowledgeFile,
  useProcessKnowledgeFile,
} from '@/hooks/use-knowledge-base';
import { Loader2Icon, UploadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadFileDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadFileDialogProps) {
  const t = useTranslations('KnowledgeBase');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useUploadKnowledgeFile();
  const processMutation = useProcessKnowledgeFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error(t('selectFile'));
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult = await response.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Step 2: Create database record
      await uploadMutation.mutateAsync(uploadResult.data);

      // Step 3: Process file
      await processMutation.mutateAsync(uploadResult.data.fileId);

      // Reset form
      setFile(null);
      setTitle('');
      setAuthor('');
      setDescription('');

      toast.success(t('uploadSuccess'));
      onSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('uploadFile')}</DialogTitle>
          <DialogDescription>{t('uploadDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">{t('file')}</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.txt,.md,.markdown,.epub,.docx"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="mt-1 text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">{t('titleLabel')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="author">{t('authorLabel')}</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t('authorPlaceholder')}
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="description">{t('descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              disabled={uploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {t('uploading')}
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                {t('upload')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
