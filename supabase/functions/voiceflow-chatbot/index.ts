import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  action: string;
  userId?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, data }: RequestPayload = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;

    switch (action) {
      case "get_profile":
        result = await getProfile(supabase, userId);
        break;

      case "get_my_tasks":
        result = await getMyTasks(supabase, userId);
        break;

      case "get_all_tasks":
        result = await getAllTasks(supabase, userId);
        break;

      case "create_task":
        result = await createTask(supabase, userId, data);
        break;

      case "update_task_status":
        result = await updateTaskStatus(supabase, userId, data);
        break;

      case "get_materials":
        result = await getMaterials(supabase, userId);
        break;

      case "request_material":
        result = await requestMaterial(supabase, userId, data);
        break;

      case "update_material_status":
        result = await updateMaterialStatus(supabase, userId, data);
        break;

      case "get_sites":
        result = await getSites(supabase);
        break;

      case "get_workers":
        result = await getWorkers(supabase, userId);
        break;

      case "get_timesheets":
        result = await getTimesheets(supabase, userId, data);
        break;

      case "create_timesheet":
        result = await createTimesheet(supabase, userId, data);
        break;

      case "get_task_summary":
        result = await getTaskSummary(supabase, userId);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { error: "Profile not found" };

  return {
    profile: {
      name: data.full_name,
      email: data.email,
      role: data.role,
    },
  };
}

async function getMyTasks(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      sites (name)
    `)
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const tasks = data.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    site: task.sites?.name || "Unknown",
    created_at: task.created_at,
  }));

  return { tasks, count: tasks.length };
}

async function getAllTasks(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Only managers can view all tasks" };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      sites (name),
      profiles!tasks_assigned_to_fkey (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const tasks = data.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assigned_to: task.profiles?.full_name || "Unassigned",
    site: task.sites?.name || "Unknown",
    created_at: task.created_at,
  }));

  return { tasks, count: tasks.length };
}

async function createTask(supabase: any, userId: string, data: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Only managers can create tasks" };
  }

  const { error } = await supabase
    .from("tasks")
    .insert({
      title: data.title,
      description: data.description || "",
      site_id: data.siteId,
      assigned_to: data.assignedTo || null,
      status: "todo",
    });

  if (error) throw error;

  return { success: true, message: "Task created successfully" };
}

async function updateTaskStatus(supabase: any, userId: string, data: any) {
  const updateData: any = { status: data.status };

  if (data.status === "complete") {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = userId;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", data.taskId);

  if (error) throw error;

  return { success: true, message: "Task status updated successfully" };
}

async function getMaterials(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("materials")
    .select(`
      id,
      item_name,
      quantity,
      unit,
      comment,
      status,
      created_at,
      sites (name),
      profiles!materials_requested_by_fkey (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const materials = data.map((mat: any) => ({
    id: mat.id,
    item: mat.item_name,
    quantity: mat.quantity,
    unit: mat.unit || "units",
    comment: mat.comment,
    status: mat.status,
    requested_by: mat.profiles?.full_name || "Unknown",
    site: mat.sites?.name || "Unknown",
    created_at: mat.created_at,
  }));

  return { materials, count: materials.length };
}

async function requestMaterial(supabase: any, userId: string, data: any) {
  const { error } = await supabase
    .from("materials")
    .insert({
      item_name: data.itemName,
      quantity: data.quantity,
      unit: data.unit || "units",
      comment: data.comment || "",
      site_id: data.siteId,
      requested_by: userId,
      status: "new",
    });

  if (error) throw error;

  return { success: true, message: "Material request created successfully" };
}

async function updateMaterialStatus(supabase: any, userId: string, data: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Only managers can update material status" };
  }

  const { error } = await supabase
    .from("materials")
    .update({ status: data.status })
    .eq("id", data.materialId);

  if (error) throw error;

  return { success: true, message: "Material status updated successfully" };
}

async function getSites(supabase: any) {
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, description")
    .order("name");

  if (error) throw error;

  return { sites: data, count: data.length };
}

async function getWorkers(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "manager") {
    return { error: "Only managers can view workers" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "worker")
    .order("full_name");

  if (error) throw error;

  return { workers: data, count: data.length };
}

async function getTimesheets(supabase: any, userId: string, data: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  let query = supabase
    .from("timesheets")
    .select(`
      id,
      date,
      hours,
      work_type,
      notes,
      profiles!timesheets_user_id_fkey (full_name),
      sites (name)
    `)
    .order("date", { ascending: false })
    .limit(50);

  if (profile?.role !== "manager") {
    query = query.eq("user_id", userId);
  } else if (data?.workerId) {
    query = query.eq("user_id", data.workerId);
  }

  const { data: timesheets, error } = await query;

  if (error) throw error;

  const formatted = timesheets.map((ts: any) => ({
    id: ts.id,
    date: ts.date,
    hours: ts.hours,
    work_type: ts.work_type,
    notes: ts.notes,
    worker: ts.profiles?.full_name || "Unknown",
    site: ts.sites?.name || "Unknown",
  }));

  return { timesheets: formatted, count: formatted.length };
}

async function createTimesheet(supabase: any, userId: string, data: any) {
  const { error } = await supabase
    .from("timesheets")
    .insert({
      user_id: userId,
      site_id: data.siteId,
      date: data.date,
      hours: data.hours,
      work_type: data.workType,
      notes: data.notes || "",
    });

  if (error) throw error;

  return { success: true, message: "Timesheet entry created successfully" };
}

async function getTaskSummary(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const isManager = profile?.role === "manager";

  let query = supabase.from("tasks").select("status");

  if (!isManager) {
    query = query.eq("assigned_to", userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const summary = {
    total: data.length,
    todo: data.filter((t: any) => t.status === "todo").length,
    in_progress: data.filter((t: any) => t.status === "in_progress").length,
    complete: data.filter((t: any) => t.status === "complete").length,
  };

  return { summary };
}
