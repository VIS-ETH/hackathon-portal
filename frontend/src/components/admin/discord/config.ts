import { useMemo } from "react";

import { useDebouncedValue } from "@mantine/hooks";

import Ajv from "ajv";
import { parse } from "yaml";

interface Role {
  name: string;
  slug: string;
  special:
    "admin" | "mentor" | "stakeholder" | "sidequest_master" | "participant";
  color: string;
  show_in_roster?: boolean;
  mentionable?: boolean;
}

interface Category {
  slug: string;
  name: string;
  special?: string;
  visible_to: string | string[] | null;
  writable_by: string | string[] | null;
}

interface Channel {
  name: string;
  category: string;
  visible_to?: string | string[] | null;
  writable_by?: string | string[] | null;
  default_notification?: "all" | "mentions" | "none";
  voice?: boolean;
}

export interface DiscordConfig {
  default_permissions: Record<string, boolean>;
  roles: Role[];
  categories: Category[];
  channels: Channel[];
}

const discordSchema: object = {
  type: "object",
  properties: {
    default_permissions: {
      type: "object",
      additionalProperties: { type: "boolean" },
    },
    roles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          special: {
            type: "string",
            enum: [
              "admin",
              "mentor",
              "stakeholder",
              "sidequest_master",
              "participant",
            ],
          },
          color: { type: "string" },
          show_in_roster: { type: "boolean", nullable: true, default: true },
          mentionable: { type: "boolean", nullable: true, default: true },
        },
        required: ["name", "slug", "color"],
        additionalProperties: false,
      },
    },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          special: { type: "string", nullable: true },
          visible_to: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "all",
          },
          writable_by: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "admin",
          },
        },
        required: ["slug", "name"],
        additionalProperties: false,
      },
    },
    channels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          visible_to: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
                nullable: true,
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "all",
          },
          writable_by: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "admin",
          },
          default_notification: {
            type: "string",
            enum: ["all", "mentions", "none"],
            nullable: true,
            default: "none",
          },
          voice: { type: "boolean", nullable: true, default: false },
        },
        required: ["name", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["categories", "channels", "default_permissions", "roles"],
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: true, verbose: true });
const validate = ajv.compile(discordSchema);

export const useYamlValidation = (yamlInput: string) => {
  const [debouncedYaml] = useDebouncedValue(yamlInput, 500);

  const validationState = useMemo<{
    isValid: boolean | null;
    error: string | null;
    data: DiscordConfig | null;
  }>(() => {
    if (!debouncedYaml.trim()) {
      return {
        isValid: null,
        error: null,
        data: null,
      };
    }

    try {
      const data = parse(debouncedYaml) as DiscordConfig;
      const isValid = validate(data);

      if (isValid) {
        return {
          isValid: true,
          error: null,
          data,
        };
      } else {
        const formattedErrors =
          validate.errors
            ?.map((error) => {
              const path = error.instancePath
                ? `at path "${error.instancePath}": `
                : "";
              return `• ${path}${error.message} (${JSON.stringify(error.params)})`;
            })
            .join("\n") || "Unknown validation error";

        return {
          isValid: false,
          error: formattedErrors,
          data: null,
        };
      }
    } catch (err: unknown) {
      return {
        isValid: false,
        error: `YAML Syntax Error: ${err instanceof Error ? err.message : String(err)}`,
        data: null,
      };
    }
  }, [debouncedYaml]);

  return { ...validationState, pending: debouncedYaml !== yamlInput };
};
