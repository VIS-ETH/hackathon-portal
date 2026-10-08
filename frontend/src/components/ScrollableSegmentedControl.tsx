import {
  ScrollArea,
  SegmentedControl,
  SegmentedControlProps,
} from "@mantine/core";

// Mantine places the active indicator without the control's own scroll offset, so a control
// that overflows must keep its full width and scroll inside a ScrollArea instead.
const ScrollableSegmentedControl = (props: SegmentedControlProps) => {
  return (
    <ScrollArea scrollbars="x" type="never">
      <SegmentedControl
        size="sm"
        radius="md"
        withItemsBorders={false}
        {...props}
      />
    </ScrollArea>
  );
};

export default ScrollableSegmentedControl;
