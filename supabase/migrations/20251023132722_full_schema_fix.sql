create type "public"."lead_status" as enum ('NEW', 'APPROVED', 'COMPLETED');

create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "event_type" text not null default 'unknown'::text,
    "actor_id" uuid,
    "lead_id" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "org_id" text
);


alter table "public"."events" enable row level security;

create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "source" text not null,
    "name" text not null,
    "phone" text not null,
    "description" text,
    "status" lead_status not null,
    "created_at" timestamp with time zone default now(),
    "org_id" text
);


alter table "public"."leads" enable row level security;

create table "public"."push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "org_id" text not null,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."push_subscriptions" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text not null,
    "email" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE INDEX idx_events_org_id ON public.events USING btree (org_id);

CREATE INDEX idx_events_type_time ON public.events USING btree (event_type, created_at DESC);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);

CREATE INDEX idx_leads_org_id ON public.leads USING btree (org_id);

CREATE INDEX idx_leads_status ON public.leads USING btree (status);

CREATE INDEX idx_leads_user_id ON public.leads USING btree (user_id);

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);

CREATE INDEX idx_push_subscriptions_org_id ON public.push_subscriptions USING btree (org_id);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."events" add constraint "events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."events" validate constraint "events_actor_id_fkey";

alter table "public"."events" add constraint "events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) not valid;

alter table "public"."events" validate constraint "events_lead_id_fkey";

alter table "public"."leads" add constraint "leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."leads" validate constraint "leads_user_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_endpoint_key" UNIQUE using index "push_subscriptions_endpoint_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_event_org_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.org_id is null and new.lead_id is not null then
    select l.org_id into new.org_id
    from public.leads l
    where l.id = new.lead_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."push_subscriptions" to "anon";

grant insert on table "public"."push_subscriptions" to "anon";

grant references on table "public"."push_subscriptions" to "anon";

grant select on table "public"."push_subscriptions" to "anon";

grant trigger on table "public"."push_subscriptions" to "anon";

grant truncate on table "public"."push_subscriptions" to "anon";

grant update on table "public"."push_subscriptions" to "anon";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant references on table "public"."push_subscriptions" to "authenticated";

grant select on table "public"."push_subscriptions" to "authenticated";

grant trigger on table "public"."push_subscriptions" to "authenticated";

grant truncate on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "service_role";

grant insert on table "public"."push_subscriptions" to "service_role";

grant references on table "public"."push_subscriptions" to "service_role";

grant select on table "public"."push_subscriptions" to "service_role";

grant trigger on table "public"."push_subscriptions" to "service_role";

grant truncate on table "public"."push_subscriptions" to "service_role";

grant update on table "public"."push_subscriptions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Authenticated users read events"
on "public"."events"
as permissive
for select
to authenticated
using (true);


create policy "Service role full access"
on "public"."events"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "events_insert_block_all"
on "public"."events"
as permissive
for insert
to authenticated, anon
with check (false);


create policy "events_select_by_org"
on "public"."events"
as permissive
for select
to authenticated, anon
using ((org_id = (auth.jwt() ->> 'org_id'::text)));


create policy "events_update_block_all"
on "public"."events"
as permissive
for update
to authenticated, anon
using (false)
with check (false);


create policy "Authenticated users read leads"
on "public"."leads"
as permissive
for select
to authenticated
using (true);


create policy "Service role full access"
on "public"."leads"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "leads_insert_block_all"
on "public"."leads"
as permissive
for insert
to authenticated, anon
with check (false);


create policy "leads_select_by_org"
on "public"."leads"
as permissive
for select
to authenticated, anon
using ((org_id = (auth.jwt() ->> 'org_id'::text)));


create policy "leads_update_block_all"
on "public"."leads"
as permissive
for update
to authenticated, anon
using (false)
with check (false);


create policy "Service role has full access to push_subscriptions"
on "public"."push_subscriptions"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can manage own org subscriptions"
on "public"."push_subscriptions"
as permissive
for all
to authenticated
using ((org_id = current_setting('app.current_org_id'::text, true)))
with check ((org_id = current_setting('app.current_org_id'::text, true)));


create policy "Users can view own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "users_self_select_only"
on "public"."users"
as permissive
for select
to authenticated
using ((id = auth.uid()));


CREATE TRIGGER trg_events_set_org_id BEFORE INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION set_event_org_id();

CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();


