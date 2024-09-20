"use client";

import { useGetUsers } from "@/api/gen";

export default function Home() {
  const { data: users } = useGetUsers(); // example API call

  return (
    <>
      <h1>Hello, world!</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </>
  );
}
