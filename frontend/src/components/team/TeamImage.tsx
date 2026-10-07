import { AspectRatio, BoxProps, Image, MantineRadius } from "@mantine/core";

// Team photos are always shown at this ratio, cropped to fit, so that teams
// know how to frame them.
export const TEAM_PHOTO_RATIO = 4 / 3;

type TeamImageProps = {
  url?: string | null;
  width?: BoxProps["w"];
  alt?: string;
  // when the photo isn't flush with a card's edges
  radius?: MantineRadius;
};

const TeamImage = ({ url, width, alt, radius }: TeamImageProps) => {
  if (!url) {
    return null;
  }

  return (
    <AspectRatio ratio={TEAM_PHOTO_RATIO} w={width}>
      <Image src={url} alt={alt} fit="cover" radius={radius} />
    </AspectRatio>
  );
};

export default TeamImage;
