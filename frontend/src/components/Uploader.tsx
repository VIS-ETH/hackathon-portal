import { useCreateUpload } from "@/api/gen";
import { MediaUsage } from "@/api/gen/schemas";
import { alertProps, largeIconProps } from "@/styles/common";

import { Fragment, useState } from "react";

import { Alert, Code, List, Stack, Text } from "@mantine/core";

import { Dropzone, FileRejection } from "@mantine/dropzone";

import { IconAlertCircle, IconUpload, IconX } from "@tabler/icons-react";

type UploaderProps = {
  eventId: string;
  usage: MediaUsage;
  maxSizeMB: number;
  accept: string[];
  multiple?: boolean;
  onUploaded: (uploadedIds: string[], uploadedFiles: File[]) => void;
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
    const uploadedIds: string[] = [];
    const uploadedFiles: File[] = [];

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

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
            "Content-Length": contentLength.toString(),
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Upload failed with ${uploadResponse.status}: ${uploadResponse.statusText}`,
          );
        }

        uploadedIds.push(uploadId);
        uploadedFiles.push(file);
      } catch (error) {
        console.error("Error uploading file", { file, error });
        setFailedUploads((prev) => [...prev, file]);
        continue;
      }
    }

    setIsUploading(false);
    if (uploadedIds.length > 0) {
      onUploaded(uploadedIds, uploadedFiles);
    }
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
        <Alert
          {...alertProps}
          icon={<IconAlertCircle {...largeIconProps} />}
          color="yellow"
          title="Some files don't meet the requirements above"
        >
          <List>
            {rejectedFiles.map(({ file, errors }) => (
              <List.Item key={file.name}>
                <strong>{file.name}</strong> (
                {errors
                  .map((e) =>
                    e.code === "file-too-large"
                      ? `File is larger than ${maxSizeMB} MB`
                      : e.message,
                  )
                  .join(". ")}
                )
              </List.Item>
            ))}
          </List>
        </Alert>
      )}
      {failedUploads.length > 0 && (
        <Alert
          {...alertProps}
          icon={<IconAlertCircle {...largeIconProps} />}
          color="red"
          title="Some files couldn't be uploaded"
        >
          <List>
            {failedUploads.map((file) => (
              <List.Item key={file.name}>
                <strong>{file.name}</strong>
              </List.Item>
            ))}
          </List>
        </Alert>
      )}
    </Stack>
  );
};

export default Uploader;
