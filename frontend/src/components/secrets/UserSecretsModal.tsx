import SecretsList from "./SecretsList";

import { SecretValue } from "@/api/gen/schemas";
import { modalProps } from "@/styles/common";

import { Modal } from "@mantine/core";

type UserSecretsModalProps = {
  secrets: SecretValue[];
  opened: boolean;
  onClose: () => void;
};

const UserSecretsModal = ({
  secrets,
  opened,
  onClose,
}: UserSecretsModalProps) => {
  return (
    <Modal {...modalProps} opened={opened} onClose={onClose} title="My Secrets">
      <SecretsList secrets={secrets} />
    </Modal>
  );
};

export default UserSecretsModal;
