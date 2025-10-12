import { Image } from "@mantine/core";

type TeamImageProps = {
  url?: string | null;
  width?: string | number;
  height?: string | number;
  alt?: string;
  fit?: React.CSSProperties["objectFit"];
};

const TeamImage = ({ url, width, height, alt, fit }: TeamImageProps) => {
  if (url) {
    return <Image src={url} w={width} h={height} alt={alt} fit={fit} />;
  } else {
    return <></>;
  }
};

export default TeamImage;
