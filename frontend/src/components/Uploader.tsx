import { useCreateUpload } from "@/api/gen";
import { MediaUsage } from "@/api/gen/schemas";
import { cardProps, largeIconProps } from "@/styles/common";

import { Fragment, useState } from "react";

import { Card, Code, Stack, Text } from "@mantine/core";

import { Dropzone, FileRejection } from "@mantine/dropzone";

import { IconUpload, IconX } from "@tabler/icons-react";

type UploaderProps = {
  eventId: string;
  usage: MediaUsage;
  maxSizeMB: number;
  accept: string[];
  multiple?: boolean;
  onUploaded: (uploadedIds: string[]) => void;
};

const Uploader = ({
  eventId,
  usage,
  maxSizeMB,
  accept,
  multiple,
  onUploaded,
}: UploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [failedUploads, setFailedUploads] = useState<File[]>([]);

  const createUploadMutation = useCreateUpload();

  const fileOrFiles = multiple ? "files" : "file";

  const handleOnDrop = async (files: File[]) => {
    setRejectedFiles([]);
    setFailedUploads([]);

    if (files.length > 1 && !multiple) {
      setRejectedFiles(
        files.map((file) => ({
          file,
          errors: [
            {
              code: "too-many-files",
              message: "Only one file is allowed",
            },
          ],
        })),
      );
      return;
    }

    setIsUploading(true);
    let uploadedIds: string[] = [];

    for (const file of files) {
      try {
        const contentLength = file.size;
        const contentType = file.type;

        const { id: uploadId, url: uploadUrl } =
          await createUploadMutation.mutateAsync({
            data: {
              event_id: eventId,
              usage: usage,
              content_type: contentType,
              content_length: contentLength,
            },
          });

        let response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
            "Content-Length": contentLength.toString(),
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(
            `Upload failed with ${response.status}: ${response.statusText}`,
          );
        }

        uploadedIds.push(uploadId);
      } catch (error) {
        console.error("Error uploading file", { file, error });
        setFailedUploads((prev) => [...prev, file]);
        continue;
      }
    }

    setIsUploading(false);
    onUploaded(uploadedIds);
  };

  const handleOnReject = (rejectedFiles: FileRejection[]) => {
    setRejectedFiles(rejectedFiles);
  };

  return (
    <Stack>
      <Dropzone
        onDrop={handleOnDrop}
        onReject={handleOnReject}
        maxSize={maxSizeMB * 1024 ** 2}
        accept={accept}
        multiple={multiple}
        radius="md"
        loading={isUploading}
      >
        <Stack
          p="lg"
          gap="xl"
          align="center"
          ta="center"
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              {...largeIconProps}
              color="var(--mantine-color-blue-6)"
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX {...largeIconProps} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload
              {...largeIconProps}
              color="var(--mantine-color-dimmed)"
            />
          </Dropzone.Idle>
          <Stack gap="xs">
            <Text size="xl">
              Drag {fileOrFiles} here or click to select {fileOrFiles}
            </Text>
            <Text size="sm" c="dimmed">
              Files should not exceed {maxSizeMB} MB.
              <br />
              {accept.map((value, index) => {
                return (
                  <Fragment key={value}>
                    <Code>{value}</Code>
                    {index < accept.length - 1 ? ", " : ""}
                  </Fragment>
                );
              })}
            </Text>
          </Stack>
        </Stack>
      </Dropzone>
      {rejectedFiles.length > 0 && (
        <Card {...cardProps} bg="var(--mantine-color-orange-0)">
          <Text size="sm" c="orange">
            The following files did not meet the requirements listed above.
            Please check and try again.
            <ul>
              {rejectedFiles.map(({ file, errors }) => (
                <li key={file.name}>
                  <strong>{file.name}</strong> (
                  {errors.map((e) => e.message).join(". ")})
                </li>
              ))}
            </ul>
          </Text>
        </Card>
      )}
      {failedUploads.length > 0 && (
        <Card {...cardProps} bg="var(--mantine-color-red-0)">
          <Text size="sm" c="red">
            The following files could not be uploaded due to an error.
            <ul>
              {failedUploads.map((file) => (
                <li key={file.name}>
                  <strong>{file.name}</strong>
                </li>
              ))}
            </ul>
          </Text>
        </Card>
      )}
    </Stack>
  );
};

export default Uploader;
