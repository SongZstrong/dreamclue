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
import { Loader2Icon } from 'lucide-react';
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
      console.log('📤 开始上传文件:', file.name);

      // 1. 上传文件到服务器
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('author', author || '');
      formData.append('description', description || '');

      console.log('📤 调用上传API...');
      const uploadResponse = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📦 上传响应状态:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('❌ 上传失败:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ 上传成功:', uploadResult);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const fileData = uploadResult.data;

      // 2. 创建数据库记录
      console.log('💾 创建数据库记录...');
      const dbResponse = await fetch('/api/knowledge/create-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      });

      console.log('📦 数据库响应状态:', dbResponse.status);

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        console.error('❌ 数据库记录创建失败:', errorData);
        throw new Error(errorData.error || 'Failed to create database record');
      }

      const dbResult = await dbResponse.json();
      console.log('✅ 数据库记录创建成功:', dbResult);

      // 3. 触发文件处理
      console.log('⚙️ 触发文件处理...');
      const processResponse = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileData.fileId }),
      });

      console.log('📦 处理响应状态:', processResponse.status);

      if (!processResponse.ok) {
        console.warn('⚠️ 文件处理触发失败,但文件已上传');
      } else {
        console.log('✅ 文件处理已触发');
      }

      // 重置表单
      setFile(null);
      setTitle('');
      setAuthor('');
      setDescription('');

      toast.success('文件上传成功!正在处理中...');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('❌ 上传失败:', error);
      toast.error(error instanceof Error ? error.message : '上传失败');
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
              disabled={uploading}
              rows={3}
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
          <Button onClick={handleSubmit} disabled={uploading || !file}>
            {uploading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {uploading ? t('uploading') : t('upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
