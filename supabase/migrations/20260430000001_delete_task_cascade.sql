-- Function: delete_task_cascade
-- Deletes a task and all related data in the correct dependency order:
--   task_comments → task (storage files are handled client-side)
create or replace function delete_task_cascade(p_task_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Delete all comments tied to this task
  delete from task_comments where task_id = p_task_id;

  -- 2. Delete the task itself
  delete from tasks where id = p_task_id;
end;
$$;
