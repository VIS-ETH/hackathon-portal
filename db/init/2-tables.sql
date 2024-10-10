
create table if not exists event
(
    id                    uuid default gen_random_uuid() not null
        primary key,
    name                  text                           not null,
    slug                  text                           not null,
    start                 timestamp(3)                   not null,
    "end"                 timestamp(3)                   not null,
    max_team_size         integer                        not null,
    is_read_only          boolean                        not null,
    is_feedback_visible   boolean                        not null,
    visibility            event_visibility               not null,
    phase                 event_phase                    not null,
    sidequest_cooldown    integer                        not null,
    documentation_content text,
    welcome_content       text
);

alter table event
    owner to portal;

create table if not exists appointment
(
    id          uuid default gen_random_uuid() not null
        primary key,
    event_id    uuid                           not null
        references event
            on update cascade on delete restrict,
    title       text                           not null,
    description text,
    content     text,
    start       timestamp(3)                   not null,
    "end"       timestamp(3)
);

alter table appointment
    owner to portal;

create unique index if not exists event_name_key
    on event (name);

create unique index if not exists event_slug_key
    on event (slug);

create table if not exists project
(
    id       uuid default gen_random_uuid() not null
        primary key,
    event_id uuid                           not null
        references event
            on update cascade on delete restrict,
    name     text                           not null,
    slug     text                           not null,
    content  text                           not null
);

alter table project
    owner to portal;

create unique index if not exists project_event_id_name_key
    on project (event_id, name);

create unique index if not exists project_event_id_slug_key
    on project (event_id, slug);

create table if not exists sidequest
(
    id                      uuid default gen_random_uuid() not null
        primary key,
    event_id                uuid                           not null
        references event
            on update cascade on delete restrict,
    name                    text                           not null,
    slug                    text                           not null,
    description             text                           not null,
    is_higher_result_better boolean                        not null
);

alter table sidequest
    owner to portal;

create unique index if not exists sidequest_event_id_name_key
    on sidequest (event_id, name);

create unique index if not exists sidequest_event_id_slug_key
    on sidequest (event_id, slug);

create table if not exists team
(
    id         uuid default gen_random_uuid() not null
        primary key,
    event_id   uuid                           not null
        references event
            on update cascade on delete restrict,
    project_id uuid
                                              references project
                                                  on update cascade on delete set null,
    name       text                           not null,
    slug       text                           not null,
    index      integer                        not null,
    password   text
);

alter table team
    owner to portal;

create table if not exists project_preference
(
    team_id    uuid    not null
        references team
            on update cascade on delete restrict,
    project_id uuid    not null
        references project
            on update cascade on delete restrict,
    score      integer not null,
    primary key (team_id, project_id)
);

alter table project_preference
    owner to portal;

create table if not exists sidequest_score
(
    id       uuid default gen_random_uuid() not null
        primary key,
    team_id  uuid                           not null
        references team
            on update cascade on delete restrict,
    score    double precision               not null,
    valid_at timestamp(3)                   not null
);

alter table sidequest_score
    owner to portal;

create unique index if not exists team_event_id_name_key
    on team (event_id, name);

create unique index if not exists team_event_id_slug_key
    on team (event_id, slug);

create table if not exists "user"
(
    id      uuid default gen_random_uuid() not null
        primary key,
    auth_id text                           not null,
    name    text                           not null,
    index   integer                        not null
);

alter table "user"
    owner to portal;

create table if not exists event_role_assignment
(
    user_id  uuid       not null
        references "user"
            on update cascade on delete restrict,
    event_id uuid       not null
        references event
            on update cascade on delete restrict,
    role     event_role not null,
    primary key (user_id, event_id, role)
);

alter table event_role_assignment
    owner to portal;

create table if not exists sidequest_attempt
(
    id           uuid default gen_random_uuid() not null
        primary key,
    sidequest_id uuid                           not null
        references sidequest
            on update cascade on delete restrict,
    user_id      uuid                           not null
        references "user"
            on update cascade on delete restrict,
    result       double precision               not null,
    attempted_at timestamp(3)                   not null
);

alter table sidequest_attempt
    owner to portal;

create table if not exists team_role_assignment
(
    user_id uuid      not null
        references "user"
            on update cascade on delete restrict,
    team_id uuid      not null
        references team
            on update cascade on delete restrict,
    role    team_role not null,
    primary key (user_id, team_id, role)
);

alter table team_role_assignment
    owner to portal;

create unique index if not exists user_auth_id_key
    on "user" (auth_id);

create unique index if not exists user_name_index_key
    on "user" (name, index);

create table if not exists expert_rating
(
    id       uuid default gen_random_uuid() not null
        primary key,
    team_id  uuid                           not null
        references team
            on update cascade on delete restrict,
    user_id  uuid                           not null
        references "user"
            on update cascade on delete restrict,
    category expert_rating_category         not null,
    rating   double precision               not null
);

alter table expert_rating
    owner to portal;

create unique index if not exists expert_rating_team_id_user_id_category_key
    on expert_rating (team_id, user_id, category);
