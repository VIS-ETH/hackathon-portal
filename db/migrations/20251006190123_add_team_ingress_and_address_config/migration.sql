-- AlterTable
ALTER TABLE "event"
    ADD COLUMN "managed_address_template" TEXT,
    ADD COLUMN "direct_address_template" TEXT,
    ADD COLUMN "private_address_template" TEXT,
    ADD COLUMN "ssh_config_template" TEXT;

-- AlterTable
ALTER TABLE "team"
    ADD COLUMN "managed_address_override" TEXT,
    ADD COLUMN "direct_address_override" TEXT,
    ADD COLUMN "private_address_override" TEXT,
    ADD COLUMN "ssh_config_override" TEXT,
    ADD COLUMN "ingress_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "ingress_config" JSONB NOT NULL DEFAULT '{"version":1,"mode":"Managed","config":{"server_port":8080,"access_control_mode":"AuthenticationAuthorization"}}';
