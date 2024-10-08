
INSERT INTO public."user" (id, auth_id, name, index) VALUES ('5c284b2d-b16d-4963-955e-4300be0809b2', 'heberhard@ethz.ch', 'Hannes Eberhard', 0);

INSERT INTO public.event (id, name, slug, start, "end", max_team_size, is_read_only, is_feedback_visible, visibility, phase, sidequest_cooldown, documentation_content, welcome_content) VALUES ('fae4d7ff-ee08-4e16-8802-a1b1797145d5', 'VIScon 2024',           'viscon-2024',         '2024-10-11 10:00:00.000', '2024-10-13 16:00:00.000', 5, false, false, 'HIDDEN', 'REGISTRATION', 60, e'Lorem Ipsum', e'Lorem Ipsum');
INSERT INTO public.event (id, name, slug, start, "end", max_team_size, is_read_only, is_feedback_visible, visibility, phase, sidequest_cooldown, documentation_content, welcome_content) VALUES ('0dd9cedb-c03c-4bf9-9971-3afbf07f8540', 'VIScon 2024 [TESTING]', 'viscon-2024-testing', '2024-10-11 10:00:00.000', '2024-10-13 16:00:00.000', 5, false, false, 'HIDDEN', 'REGISTRATION', 60, e'Lorem Ipsum', e'Lorem Ipsum');

INSERT INTO public.event_role_assignment (user_id, event_id, role) VALUES ('5c284b2d-b16d-4963-955e-4300be0809b2', 'fae4d7ff-ee08-4e16-8802-a1b1797145d5', 'ADMIN');
INSERT INTO public.event_role_assignment (user_id, event_id, role) VALUES ('5c284b2d-b16d-4963-955e-4300be0809b2', '0dd9cedb-c03c-4bf9-9971-3afbf07f8540', 'ADMIN');
