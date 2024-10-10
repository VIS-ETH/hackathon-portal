
create type event_phase as enum ('REGISTRATION', 'HACKING', 'GRADING', 'FINISHED');

alter type event_phase owner to portal;

create type event_role as enum ('ADMIN', 'MENTOR', 'STAKEHOLDER', 'PARTICIPANT', 'SIDEQUEST_MASTER');

alter type event_role owner to portal;

create type event_visibility as enum ('HIDDEN', 'INTERNAL', 'PUBLIC');

alter type event_visibility owner to portal;

create type team_role as enum ('MENTOR', 'MEMBER');

alter type team_role owner to portal;

create type expert_rating_category as enum ('FUNCTIONALITY', 'UX', 'PRESENTATION');

alter type expert_rating_category owner to portal;
