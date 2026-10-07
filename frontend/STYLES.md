# Frontend style guide

Conventions for `frontend/src` (Next.js app router, Mantine 8). They describe how the code is written today, plus a few shared building blocks that make the patterns explicit.

## 1. Principles

- **Mantine first.** Build UIs from Mantine components and their props: style props such as `c`, `fw`, `ta`, `w`, `miw`, `mt`, plus `variant`, `size` and `radius`.
- **No custom CSS without discussing it with the maintainers.** That means no `style={{…}}`, no `styles={{…}}`, no `className` with own classes, no new CSS modules and no global CSS. Tailwind isn't installed; its classes do nothing. §15 lists the existing exceptions; don't copy them.
- **Presets over repetition.** Shared props live in `src/styles/common.ts`, shared building blocks in `src/components/`. When a pattern repeats, add or extend a preset or component instead of copying props around.
- **One implementation per pattern.** No parallel variants of the same widget.
- **Consistency beats local optimization.** If a screen needs something new, add it here.

## 2. Prop order and overrides

Later props win. Order the props of an element like this:

1. `key`
2. preset spreads: `{...cardProps}`, `{...inputProps}`
3. form bindings: `{...form.getInputProps("name")}`, `key={form.key("name")}`
4. call-site props, including deliberate overrides of the preset (`size="sm"`, `minRows={4}`)

Rules:

- Never put a spread after explicit props unless the component deliberately forces those values.
- Know what a spread sets before overriding it. `textareaProps` already sets `autosize`/`minRows`/`maxRows`; `cardSectionProps` sets `p` and `withBorder`; `form.getInputProps` sets `value`/`onChange`/`onBlur`/`error`, so an explicit `onBlur` after it replaces the form's.
- Pick the right preset instead of overriding a wrong one, e.g. `toolbarButtonProps`, not `secondaryButtonProps` + `size="sm"`.
- A preset that extends another spreads the base first: `{ ...cardProps, withBorder: false }`.
- Presets shared by several components (`inputProps`, `textareaProps`) are typed with `satisfies Partial<…Props>` instead of an annotation, so their literal types spread into any input without a cast.
- **Wrapper components with `...rest`** (e.g. `components/select/*`): spread defaults the caller may change (placeholder, clearable, searchable) **before** `{...rest}`, and the props the wrapper owns (`data`, `value`, `onChange`) **after** it. Omit the owned props from the wrapper's prop type.

## 3. Theme and color

- The primary color depends on the user's highest event role (`contexts/MantineContext.tsx`): admin blue-gray, mentor green, sidequest master violet, stakeholder orange, participant blue, otherwise gray. Primary actions use the default color. Never hard-code the role color.
- Semantic colors: `red` = destructive, error, or immediate effect; `yellow` = attention; `green` = success; `c="dimmed"` = secondary text.
- No hex/rgb values in components. The one exception is the podium metals in `podiumPlaces` (`styles/common.ts`).
- Light color scheme. Still use theme colors and variables so dark mode stays possible.

## 4. Pages and layout

- `AppLayout`: Navbar, `<Container {...containerProps} py="xl">` (960px), Footer. The Discord banner sits on top unless suppressed.
- The admin page needs room for its wide tables: `AppLayout wide` switches the navbar, the content and the footer to `wideContainerProps` (xl, 1320px). Other pages stay at 960px.
- A page is `"use client"`, resolves its data with `useResolveParams()`, and returns `<PageSkeleton />` until the required data is loaded. `PageLoader` is only for full-screen views.
- Root `<Stack>`. Header row:
  ```tsx
  <Group justify="space-between">
    <Title order={2}>Projects</Title>
    <Button {...secondaryButtonProps} leftSection={<IconPlus {...iconProps} />}>
      Create
    </Button>
  </Group>
  ```
  Every non-tabbed page has this left-aligned title. Standard actions: Create (`IconPlus`), Update (`IconPencil`), Delete (`IconTrash`, `color="red"`).
- **Page tabs** (admin, sidequests):
  - `<Tabs {...pageTabsProps}>`, where `mt="-md"` pulls the tab bar up to the container padding.
  - Only the active panel is mounted (`keepMounted: false` in `tabsProps`, which `pageTabsProps` extends), so hidden panels don't render or fetch. A draft that has to survive a tab switch lives above the `Tabs`; any other local state of a panel (filters, scroll) resets.
  - `Tabs.Tab` with `leftSection={<Icon {...iconProps} />}`, and `<Tabs.Panel {...tabsPanelProps}>`.
  - The active tab is synced with `location.hash` (read on mount, `history.replaceState` on change).
  - Tabs containing forms guard switching with `confirmDiscard()`.
- **Nested tabs** (inside page content, e.g. Edit/Preview) use `<Tabs {...tabsProps}>` and `tabsPanelProps`, never the negative margin.
- **Sub-tabs inside a tab** use a segmented control above the content, as in the Secrets tab:
  ```tsx
  <Group>
    <ScrollableSegmentedControl data={…} value={…} onChange={(v) => confirmDiscard() && set(v)} />
  </Group>
  ```
- **Segmented controls** always use `ScrollableSegmentedControl` (size `sm`, radius `md`, no item borders). It scrolls inside a `ScrollArea` when it doesn't fit, because Mantine misplaces the active indicator of a control that scrolls itself. Inside a nested `Group` (label + control), give that `Group` `miw={0}` so it can shrink.
- Page sections: a `Title order={3}` (left-aligned) per section. Sections are `xl` apart; content within a section uses the default gap (`md`).
- Responsive grids: `SimpleGrid cols={{ xs: 1, sm/md: n }}`. At 390px nothing may overflow horizontally, except table scroll containers.

## 5. Typography and text

- `Title order={2}` = page, `order={3}` = page section. `order={1}` only on the landing page and in presentations. **Never put a `Title` inside a card**; card titles go through `CardHeader`.
- `Text`: the default size for content, `size="sm"` for secondary info, table cells and meta, `size="xs"` only for tiny hints.
- Weights: `fw={600}` for row titles (e.g. `LinkCard`), `fw={700}` in card headers (via the preset).
- **Casing:**
  - Title Case for page/section/card/modal/drawer titles, buttons, tabs, segmented options and menu items ("Invite Users", "Team Secrets").
  - Sentence case for form-field labels, checkbox/switch labels, descriptions, alert titles and bodies, empty states and confirm texts ("Max team size", "Projects visible", "Someone else has changed the blog").
  - No ALL-CAPS sentences; use `<strong>` for emphasis.
- Formatting helpers (`src/utils`): `fmtTeamIndex` (2-digit index), `fmtScore` (2 decimals), `fmtResult` (sidequest results, 1 decimal). Dates use react-intl (`FormattedDate`, `intl.formatDate`); backend timestamps are naive UTC, so append `Z`.
- Monospace: `ff="monospace"` (not `"mono"`).

## 6. Spacing, sizing, radius, icons

- Spacing only via tokens (`xs`–`xl`). Default `Stack`/`Group` gap is `md`. Use `gap="xs"` for button groups and icon+text, `gap={0}` for label/description pairs.
- **Radius `md` everywhere**: cards, inputs, buttons, modals, menus, alerts, segmented controls, progress bars. It comes from the presets; pass `radius="md"` where no preset exists.
- Sizes:
  - Inputs: `md` in page and drawer forms (`inputProps`), `sm` in toolbars and modals, `xs` in table cells.
  - Buttons: `primaryButtonProps` (md) for form submits, `secondaryButtonProps` (xs) for page-header and in-row actions, `toolbarButtonProps` (sm) in card toolbars, `cardHeaderButtonProps` (compact-xs) in `CardHeader` actions.
- Icons: Tabler, always with `iconProps` (16/1.5) in buttons, menus, tabs and text. `largeIconProps` (52) for alert icons and the dropzone. Use `IconTextGroup` for an icon + text row (the `lg` variant is 24px).

## 7. Cards

Presets: `cardProps` (border, radius md, padding md); `highlightedCardProps` for "your own" items (primary-0 background, no border).

Kinds:

- **Plain card**: `<Card {...cardProps}>…</Card>`.
- **Card with title**:
  ```tsx
  <Card {...cardProps}>
    <CardHeader
      title="Team Members"
      actions={<Button {...cardHeaderButtonProps}>…</Button>}
    />
    <Card.Section {...cardSectionProps}>…</Card.Section>
    <Card.Section {...cardSectionProps}>…</Card.Section>
  </Card>
  ```
  Header actions are compact, so a header with actions is as tall as one without: buttons use `cardHeaderButtonProps`, action icons `size="sm"`. When the actions don't fit next to the title (e.g. at 390px), they wrap onto the next line instead of squeezing the title.
- **Table card**: see §8.
- **Link card**: `LinkCard` for navigable rows (prefix, title, detail column, badges, chevron; `highlight` for your own items).
- **Markdown card**: `MarkdownCard`. `Markdown` renders links as `Anchor`s in the text color with a dotted underline; elsewhere the global `a` reset in `globals.css` drops link styling.
- **Collapsible card**: `<Accordion variant="contained" radius="md">` with one item, for long content that starts collapsed (e.g. a project description in the jury rating). The control shows a bold title (`fw={700}`) with dimmed detail below it. Never inside another card.

Rules:

- `Card.Section` must be a **direct child** of `Card`. Mantine trims the first/last section's margins and borders with `:first-child`/`:last-child`. Wrapping sections in a `Stack`/`Group` causes full-bleed borders mid-card and extra gaps.
- Body sections use `cardSectionProps`. Flush content (tables, images) goes in a `Card.Section` without padding.
- **No card inside a card.** That includes `Paper withBorder` and Accordion `contained` inside a card. Structure a card with sections instead.
- **No free-standing `Divider`s** inside cards or between page sections. Use card sections, section titles and spacing. Allowed: labeled group dividers in long forms (`<Divider label="Infrastructure" labelPosition="left" />`), menu/nav dividers, and the flush divider before a drawer's markdown (`DrawerMarkdown`).
- Empty states inside a card: dimmed `Text` in a section.

## 8. Tables

- Table card layout: a toolbar section, optional filter sections, then a flush table section:
  ```tsx
  <Card {...cardProps}>
    <Card.Section {...cardSectionProps}>
      <Group>{/* Refresh, create, filters, destructive last */}</Group>
    </Card.Section>
    <Card.Section>
      <Table.ScrollContainer minWidth={…}>
        <Table striped horizontalSpacing="md">…</Table>
      </Table.ScrollContainer>
    </Card.Section>
  </Card>
  ```
- A bulk input for the table (inviting users, importing secrets) is its own card **above** the table card: one section with the textarea, then a row with the options on the left and the submit button on the right (`Group justify="space-between"`).
- `horizontalSpacing="md"` lines the cell text up with the card header and sections. Not every table card has it yet; add it when touching one.
- Columns:
  - The team index comes first (`Idx`, monospace, narrow), then the name, then the data columns.
  - Numbers are right-aligned (`ta="right"`), checkboxes are narrow, actions come last and shrink to fit (`w={1}`).
  - Widths via `Table.Th` `w`/`miw`, with `layout="fixed"` when all widths are set. In a table that scrolls, `w` alone gives way, so a column that must keep its width (e.g. `Idx`) gets both `w` and `miw`.
- Empty table: `<NoEntriesTr colSpan={n} />`.
- **Expandable rows** (e.g. the admin ranking): a column header section (`cardSectionProps`, `py="xs"`, `Text size="sm" fw={700}`; header and rows share one column layout component and its widths), then one `Card.Section` per row. The row's name cell is an `UnstyledButton` with `aria-expanded` (no chevron); other controls (e.g. a checkbox) stay outside it. Below `md` a row can take two lines through `Grid.Col` `order` (e.g. name and checkbox, then the score bar) instead of rendering a second layout. An expanded row's details follow in one more section; the row and its details get `bg="var(--mantine-color-default-hover)"` (gray-0). The details may hold cards (e.g. the team feedback categories, white on the gray), the one exception to "no card inside a card".
- Large tables: memoized row components, with stable fallbacks (`const EMPTY: never[] = []`) so `memo` stays effective.
- Inline editing:
  - Text and number fields use `useBlurSave`: save on blur (single-line fields blur on Enter), disabled while saving.
  - Selects and checkboxes mutate immediately.
  - Text cells use `size="xs"`.

## 9. Toolbars, filters, actions

- Toolbar order: Refresh (`IconRefresh`), create inputs + Add (`IconPlus`), other actions, destructive last (`color="red"`). All use `toolbarButtonProps`.
- Filters: `ScrollableSegmentedControl` with "All" plus the enum values. The active option shows a count: `Participant (12)`.
- Mutation in flight: the button's `loading` prop, or `disabled` while pending.
- Destructive or irreversible actions: a native `confirm()` describing the consequences in sentence case. When the confirm has to show what will change (e.g. the Discord configuration diff), use a `Modal` (`size="xl"`) ending in a right-aligned Cancel (`primaryButtonProps` + `variant="default"`) and the primary action. Mutation errors surface through the global MutationCache handler (`ErrorNotification`); don't add per-call error toasts.

## 10. Forms and inputs

- Forms use `@mantine/form` (`useForm`): a `Stack` of labeled inputs, with the submit button (`primaryButtonProps`) last.
- **Labels carry the meaning**, descriptions explain, placeholders only show examples. Editable current values are **prefilled**, never shown as placeholders.
- Update forms send only the modified fields: `modifiedValues(form, values)` from `src/utils/form.ts`, based on Mantine's per-field `isDirty`. For that, the initial values use the format the inputs emit: `""` for a missing string, dates via `fromUtcDate` (and back via `toUtcDate` in `transformValues`).
- A long update form (e.g. the event settings) ends with a right-aligned submit row: dimmed `Text size="sm"` "2 fields modified" (or "No changes"), then "Discard Changes" (`variant="default"`, `form.reset`) and Update. Both buttons are disabled while nothing is modified. Each modified field shows a yellow "Modified" `Badge` (with `IconArrowBackUp`) at the right end of its label row (`labelProps={{ w: "100%" }}`; checkboxes: beside the checkbox). Clicking the badge resets that field.
- **Read-only data is `Text`**, not a disabled or read-only input. Exception: values meant to be copied (access details, secrets) use read-only inputs (`PasswordInput` for secrets).
- Multi-line input:
  - `textareaProps` (autosize, 5–15 rows).
  - Code-like content (YAML, auth-id lists, SSH config) uses `codeTextareaProps` (monospace via Mantine's own `data-monospace`, as `JsonInput` does). SSH config uses `minRows={3}` and `wrap="off"`, so long lines scroll horizontally instead of wrapping.
- Infrastructure values (addresses, address templates, SSH config) are monospace everywhere, editable or read-only: `codeInputProps` for single-line inputs, `codeTextareaProps` for multi-line ones.
- Validation: field-bound errors go through the input's `error` prop. Form-level messages are `Text c="red" size="sm"` next to the submit button.
- Drafts:
  - Every component holding a draft calls `useUnsavedChanges(dirty)`.
  - In-app actions that unmount drafts (tab switches) call `confirmDiscard()` first.
  - `useBlurSave` registers itself.

## 11. Notices, loading, empty states

- Alerts:
  ```tsx
  <Alert
    {...alertProps}
    color="red"
    title="Changes apply immediately"
    icon={<IconAlertCircle {...largeIconProps} />}
  >
    <Text>…</Text>
  </Alert>
  ```
  - Red = immediate or destructive effect, yellow = attention, gray = info.
  - Titles in sentence case, emphasis with `<strong>`.
  - A tab-wide notice is the first element of the tab panel.
- Loading: `PageSkeleton` for pages, `<Skeleton {...skeletonProps} />` for sections, the `loading` prop on buttons. `Loader` only on full-screen views.
- Tooltips: a plain `Tooltip` for short labels (icon buttons, truncated values). Explanations go into the field's `description`: a tooltip doesn't show on touch.
- Empty states: dimmed `Text`, also for empty page-level lists.

## 12. Modals, drawers, menus

- Modal: `<Modal {...modalProps} opened onClose title="Title Case">`, controlled by the parent's `useDisclosure`. Large content: `size="xl"`.
- Drawer: `<Drawer {...drawerProps} opened onClose title="…">` (right, `md`, the same size for every create/update drawer, markdown preview or not), with a title naming the action ("Create Project", "Update Project"). The form inside follows §10. A markdown field's preview (or the markdown a drawer refers to) comes last, as `DrawerMarkdown` (a divider across the whole drawer, then the `MarkdownCard`).
- Menu: `<Menu {...menuProps}>`. The target is a secondary button with `IconChevronDown` as its `rightSection`; group items under `Menu.Label`; destructive items get `color="red"`.

## 13. Lists, badges, links

- Navigable lists: `LinkCard` rows.
- Labels and statuses: `<Badge {...badgeProps}>` (default variant).
- Internal links: Next `Link`. External links: `target="_blank" referrerPolicy="no-referrer"`. Inline text links: `Anchor`.

## 14. Domain conventions

- **Teams** are shown as `fmtTeamIndex(team.index)` (monospace, dimmed) **before** the name.
- **Team photos** always go through `TeamImage`: 4:3 (`TEAM_PHOTO_RATIO`), `fit="cover"`, sized by width only (full width in a flush `Card.Section`, or a fixed `width`). A photo inside a padded section (e.g. beside the team details in the jury rating, `TeamDetailsCard horizontal`) gets `radius="md"`. It renders nothing without a photo, so render its `Card.Section` only when there is one (an empty section leaves a stray border). The upload modal tells teams the ratio. Other images (blog images, the podium trophies) use Mantine's `Image`.
- **Podium**: `podiumPlaces` (place, title, metal color). Empty places show `/assets/awards/Trophy_{n}.svg`. Order on screen: 2-1-3.
- **Scores**: `fmtScore`. The score bar is `ScoreDisplay` with fixed category colors, in this order: Technical cyan, Jury pink, Public teal, Sidequests orange, Extra green. The feedback cards follow the same order.
- **Ranks** are written `#n`.

## 15. Existing exceptions (don't copy)

Inline CSS that exists today and is kept until someone decides otherwise:

- the dashed hidden-events card (home),
- `Uploader` dropzone `pointerEvents`,
- the layout CSS modules (`Navbar`, `Footer`, `UserMenu`),
- the podium gradients and metal borders in `PublicVoteInput` (podium cards and vote buttons, kept by decision),
- presentations (§16).

## 16. Out of scope: presentations

`app/events/[eventSlug]/admin/presentations/*`, `admin/Presentation.tsx` and `*Slide.tsx` are full-screen slides for a projector. They use their own layout (absolute positioning, `Title order={1}`, `hiddenScrollbarStyle`) and don't follow the page rules above.

## 17. Shared building blocks

| Preset (`styles/common.ts`)                                                                              | Use                                                                        |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `containerProps`, `wideContainerProps`                                                                   | page container; the wide one for the admin page                            |
| `inputProps`                                                                                             | inputs (`TextInput`, `NumberInput`, `Select`, `DateTimePicker`, …)         |
| `codeInputProps`                                                                                         | monospace single-line input (infrastructure values)                        |
| `textareaProps`, `codeTextareaProps`                                                                     | multi-line input; monospace variant                                        |
| `primaryButtonProps`, `secondaryButtonProps`, `toolbarButtonProps`, `cardHeaderButtonProps`              | submit / page-header and row actions / card toolbars / card header actions |
| `cardProps`, `highlightedCardProps`, `cardSectionProps`, `cardHeaderSectionProps`, `cardHeaderTextProps` | cards                                                                      |
| `badgeProps`, `indicatorBadgeProps`                                                                      | badges; the dot variant marks a special item (Discord category type)       |
| `menuProps`, `modalProps`, `drawerProps`, `alertProps`                                                   | menus, modals, drawers, alerts                                             |
| `pageTabsProps`, `tabsProps`, `tabsPanelProps`                                                           | page tabs, nested tabs, tab panels                                         |
| `iconProps`, `largeIconProps`                                                                            | icons                                                                      |
| `skeletonProps`                                                                                          | skeletons                                                                  |
| `podiumPlaces`                                                                                           | podium places and metal colors                                             |
| `hiddenScrollbarStyle`                                                                                   | presentations only                                                         |

| Component (`src/components`) | Use                                                                 |
| ---------------------------- | ------------------------------------------------------------------- |
| `CardHeader`                 | card title row with optional actions                                |
| `IconTextGroup`              | icon + text                                                         |
| `LinkCard`                   | navigable list row                                                  |
| `LabeledRow`                 | label and dimmed description, with a right-aligned value or control |
| `ScrollableSegmentedControl` | filters, sub-tabs, option pickers                                   |
| `MarkdownCard`, `Markdown`   | markdown content                                                    |
| `DrawerMarkdown`             | markdown preview at the end of a drawer                             |
| `NoEntriesTr`                | empty table row                                                     |
| `PageSkeleton`, `PageLoader` | loading states                                                      |
| `TeamImage`                  | team photo at 4:3, cropped to fit; nothing without a photo          |
| `select/*Select`             | entity selects                                                      |
| `Uploader`                   | file upload                                                         |

## 18. Checklist for new UI code

- [ ] Only Mantine props and presets, no custom CSS
- [ ] Props ordered preset → form binding → override
- [ ] Page title / section titles / `CardHeader` per §4–§5; casing per §5
- [ ] No card in a card, no free-standing `Divider`, sections as direct `Card` children
- [ ] Sizes and radius from the presets; icons with `iconProps`
- [ ] Read-only data as `Text`; current values prefilled, not as placeholders
- [ ] Empty, loading and error states covered
- [ ] Drafts guarded with `useUnsavedChanges` / `confirmDiscard`
- [ ] Checked at 1280px and 390px
