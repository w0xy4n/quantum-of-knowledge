"use client";

import { Download, FileText } from "lucide-react";
import { attachmentExt, attachmentKind } from "@/lib/attachments";

interface AssignmentAttachmentsProps {
  urls: string[];
  title: string;
  /** Крупный вариант — для диалога просмотра. */
  large?: boolean;
}

/**
 * Вложения задания: фото и видео масштабируются под рамку (object-contain,
 * ограничение по высоте), прочие файлы показываются аккуратной плашкой-ссылкой.
 */
export function AssignmentAttachments({ urls, title, large = false }: AssignmentAttachmentsProps) {
  if (urls.length === 0) return null;

  const media = urls.filter((url) => attachmentKind(url) !== "file");
  const files = urls.filter((url) => attachmentKind(url) === "file");
  const mediaHeight = large ? "max-h-[60vh]" : "max-h-64";

  return (
    <div className="mb-3 flex flex-col gap-2 min-w-0">
      {media.length > 0 && (
        <div className={media.length > 1 ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
          {media.map((url) =>
            attachmentKind(url) === "video" ? (
              // biome-ignore lint/a11y/useMediaCaption: у прикреплённых студентами видео нет субтитров
              <video
                key={url}
                src={url}
                controls
                preload="metadata"
                className={`w-full rounded-md border bg-black object-contain ${mediaHeight}`}
              />
            ) : (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block min-w-0">
                {/* biome-ignore lint/performance/noImgElement: внешний URL из Supabase Storage, next/image его не знает */}
                <img
                  src={url}
                  alt={`Вложение к заданию «${title}»`}
                  className={`w-full rounded-md border object-contain ${mediaHeight}`}
                />
              </a>
            ),
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Файл .{attachmentExt(url).toLowerCase()}</span>
              <Download aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
