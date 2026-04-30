-- Function: delete_company_cascade
-- Deletes a company and all related data in the correct dependency order:
--   task_comments → tasks → cycles → auth.users (via profiles.id) → profiles → company
create or replace function delete_company_cascade(p_company_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user_ids uuid[];
begin
  -- 0. Collect auth user IDs from profiles before deleting anything
  select array_agg(id)
  into v_user_ids
  from profiles
  where company_id = p_company_id;

  -- 1. Delete task_comments tied to tasks that belong to this company
  delete from task_comments
  where task_id in (
    select id from tasks where company_id = p_company_id
  );

  -- 2. Delete all tasks for this company
  delete from tasks where company_id = p_company_id;

  -- 3. Delete all cycles for this company
  delete from cycles where company_id = p_company_id;

  -- 4. Delete all profiles for this company
  delete from profiles where company_id = p_company_id;

  -- 5. Delete auth.users for the collected IDs (removes login credentials)
  if v_user_ids is not null then
    delete from auth.users where id = any(v_user_ids);
  end if;

  -- 6. Delete the company itself
  delete from companies where id = p_company_id;
end;
$$;
