update public.profiles
set theme_preference = 'ares'
where theme_preference not in ('ares', 'tron', 'clu', 'athena', 'aphrodite', 'poseidon');

alter table public.profiles
drop constraint if exists profiles_theme_preference_check;

alter table public.profiles
add constraint profiles_theme_preference_check
check (theme_preference in ('ares', 'tron', 'clu', 'athena', 'aphrodite', 'poseidon'));
