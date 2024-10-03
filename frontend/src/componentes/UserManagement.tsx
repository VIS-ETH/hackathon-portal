import {
  InviteUsersDto,
  UserForCreate,
  eventRole,
  useInviteUsers,
} from "@/api/gen";

import { useState } from "react";

import {
  ActionIcon,
  Flex,
  Grid,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { useForm } from "@mantine/form";
import { useListState } from "@mantine/hooks";

import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";

const ManageUser = ({ event_id }: { event_id: string }) => {
  return <Title order={3}>Manage User</Title>;
};

const InviteUser = ({ event_id }: { event_id: string }) => {
  const invite_user_query = useInviteUsers(event_id);
  // invite_user_query.mutate()

  const [newAuth, setNewAuth] = useState<string>("");
  const [newName, setNewName] = useState<string>("");

  const form = useForm<InviteUsersDto>({
    initialValues: {
      users: [],
      default_roles: [],
    },
    validate: {
      users: (value) => {
        if (value.length < 1) {
          return "You need to invite at least one user";
        }
      },
    },
  });

  const updateWorker = async (payload: InviteUsersDto) => {
    form.validate();
    if (form.validate().hasErrors) {
      return;
    }
    await invite_user_query.mutateAsync(form.values, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <Stack gap={"md"}>
      <form onSubmit={form.onSubmit(updateWorker)}>
        <Flex justify={"space-between"} align={"center"} mb={"md"}>
          <Title order={3}>Invite People</Title>

          <ActionIcon type="submit" disabled={form.values.users.length == 0}>
            <IconDeviceFloppy />
          </ActionIcon>
        </Flex>
        <MultiSelect
          label="Default Role"
          data={Object.keys(eventRole)}
          {...form.getInputProps("default_roles")}
        />
        <Text pt={"md"} fw={700}>
          These people will be Invited
        </Text>
        <Grid>
            {form.values.users.length == 0 && <Text>Add your first user</Text>}
          {form.values.users.map((user, index) => {
            return (
              <>
                <Grid.Col span={3}>
                  <Text key={index}>{user.auth_id}</Text>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Text key={index}>{user.name}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <ActionIcon
                    onClick={() => {
                      form.removeListItem("users", index);
                    }}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Grid.Col>
              </>
            );
          })}
        </Grid>
        <Text pt={"md"} fw={700}>
          Add a new User
        </Text>
        <Grid justify="end" align="bottom">
          <Grid.Col span={3}>
            <TextInput
              label="Auth ID"
              placeholder="martullo@ethz.ch"
              value={newAuth}
              onChange={(value) => setNewAuth(value.target.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Name"
              placeholder="Martullo"
              value={newName}
              onChange={(value) => setNewName(value.target.value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack justify="end" h={"100%"}>
              <ActionIcon
                onClick={() => {
                  if (newAuth === "" || newName === "") {
                    return;
                  }
                  form.insertListItem("users", {
                    auth_id: newAuth,
                    name: newName,
                  });
                  setNewAuth("");
                  setNewName("");
                }}
              >
                <IconPlus />
              </ActionIcon>
            </Stack>
          </Grid.Col>
        </Grid>
      </form>
    </Stack>
  );
};

const UserManagement = () => {
  return (
    <Stack gap={"md"}>
      <InviteUser event_id="fae4d7ff-ee08-4e16-8802-a1b1797145d5" />
      <ManageUser event_id="fae4d7ff-ee08-4e16-8802-a1b1797145d5" />
    </Stack>
  );
};

export default UserManagement;
