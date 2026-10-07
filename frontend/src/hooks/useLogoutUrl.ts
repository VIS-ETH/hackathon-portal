import { useGetConfig } from "@/api/gen";

/** The configured logout URL, or `null` if logout links should be hidden. */
export const useLogoutUrl = () => {
  const { data: config } = useGetConfig({
    query: { staleTime: Infinity },
  });

  return config?.logout_url ?? null;
};
