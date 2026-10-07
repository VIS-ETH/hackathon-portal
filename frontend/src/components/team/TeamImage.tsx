import { AspectRatio, Image } from "@mantine/core";

// Team photos are always shown at this ratio, cropped to fit, so that teams
// know how to frame them.
export const TEAM_PHOTO_RATIO = 4 / 3;

type TeamImageProps = {
  url?: string | null;
  width?: string | number;
  alt?: string;
};

const TeamImage = ({ url, width, alt }: TeamImageProps) => {
  if (!url) {
    return null;
  }

  return (
    <AspectRatio ratio={TEAM_PHOTO_RATIO} w={width}>
      <Image src={url} alt={alt} fit="cover" />
    </AspectRatio>
  );
};

export default TeamImage;
