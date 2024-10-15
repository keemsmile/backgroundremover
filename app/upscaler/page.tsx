"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import * as fal from '@fal-ai/serverless-client';

if (typeof window !== 'undefined') {
  fal.config({
    credentials: process.env.NEXT_PUBLIC_FAL_KEY,
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formSchema = z.object({
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Image is required')
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB`)
    .refine(
      (files) => ALLOWED_FILE_TYPES.includes(files[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported'
    ),
});

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = useCallback(async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const file = data.image[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      setOriginalImage(reader.result as string);
      try {
        const result = await fal.subscribe("fal-ai/imageutils/rembg", {
          input: {
            image_url: reader.result as string,
            sync_mode: true,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });
        setProcessedImage(result.image.url);
        toast({
          title: 'Background Removed',
          description: 'Your image background has been successfully removed!',
        });
      } catch (error) {
        console.error('Error removing background:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove the image background. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Image Background Remover</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="image">Upload Image</Label>
          <Input
            id="image"
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            {...form.register('image')}
          />
          {form.formState.errors.image && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.image.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Removing Background...
            </>
          ) : (
            'Remove Background'
          )}
        </Button>
      </form>
      <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {originalImage && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Original Image</h2>
            <img src={originalImage} alt="Original" className="max-w-full h-auto" />
          </div>
        )}
        {processedImage && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Image with Background Removed</h2>
            <img src={processedImage} alt="Processed" className="max-w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}