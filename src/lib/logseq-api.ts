export interface TodoBlock {
  uuid: string;
  content: string;
  marker: string;
}

export interface CompletedTodo {
  uuid: string;
  content: string;
}

export interface ProgressEntry {
  uuid: string;
  content: string;
}

export interface SessionLog {
  sessionNumber: number;
  startTime: string;
  endTime: string;
  focus: string;
  completed: CompletedTodo[];
  progress: ProgressEntry[];
}

function todayJournalName(): string {
  const now = new Date();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  const suffix = getOrdinalSuffix(day);
  return `${month} ${day}${suffix}, ${year}`;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function cleanContent(content: string): string {
  return content
    .replace(/^(TODO|DOING|DONE|NOW|LATER)\s+/, "")
    .replace(/\n?:LOGBOOK:[\s\S]*?:END:\s*/g, "")
    .replace(/\n?SCHEDULED:.*$/gm, "")
    .replace(/\n?DEADLINE:.*$/gm, "")
    .trim();
}

const OPEN_MARKERS = new Set(["TODO", "DOING", "NOW", "LATER"]);

function collectTodos(blocks: any[]): TodoBlock[] {
  const result: TodoBlock[] = [];
  for (const block of blocks) {
    const marker = block.marker ?? block[":block/marker"];
    if (marker && OPEN_MARKERS.has(marker)) {
      result.push({
        uuid: block.uuid ?? block[":block/uuid"],
        content: cleanContent(block.content ?? block[":block/content"] ?? ""),
        marker,
      });
    }
    if (block.children && block.children.length > 0) {
      result.push(...collectTodos(block.children));
    }
  }
  return result;
}

export async function getTodayTodos(): Promise<TodoBlock[]> {
  const pageName = todayJournalName();
  const blocks = await logseq.Editor.getPageBlocksTree(pageName);
  if (!blocks) return [];
  return collectTodos(blocks);
}

export async function markTodoDone(blockUuid: string): Promise<void> {
  const block = await logseq.Editor.getBlock(blockUuid);
  if (!block) return;
  const newContent = block.content.replace(
    /^(TODO|DOING|NOW|LATER)\s/,
    "DONE "
  );
  await logseq.Editor.updateBlock(blockUuid, newContent);
}

export async function markTodoDoing(blockUuid: string): Promise<void> {
  const block = await logseq.Editor.getBlock(blockUuid);
  if (!block) return;
  const newContent = block.content.replace(
    /^(TODO|NOW|LATER)\s/,
    "DOING "
  );
  await logseq.Editor.updateBlock(blockUuid, newContent);
}

export async function markTodoOpen(blockUuid: string): Promise<void> {
  const block = await logseq.Editor.getBlock(blockUuid);
  if (!block) return;
  const newContent = block.content.replace(
    /^(DONE|DOING)\s/,
    "TODO "
  );
  await logseq.Editor.updateBlock(blockUuid, newContent);
}

export async function addTodoToToday(content: string): Promise<TodoBlock | null> {
  const pageName = todayJournalName();
  let page = await logseq.Editor.getPage(pageName);
  if (!page) {
    page = await logseq.Editor.createPage(pageName, {}, { journal: true });
  }
  if (!page) return null;

  const block = await logseq.Editor.appendBlockInPage(
    page.uuid,
    `TODO ${content}`
  );
  if (!block) return null;
  return { uuid: block.uuid, content, marker: "TODO" };
}

export function formatTimeOfDay(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function logSessionToDaily(session: SessionLog): Promise<void> {
  const pageName = todayJournalName();
  let page = await logseq.Editor.getPage(pageName);
  if (!page) {
    page = await logseq.Editor.createPage(pageName, {}, { journal: true });
  }
  if (!page) return;

  const header = `Pomodoro #${session.sessionNumber} (${session.startTime} - ${session.endTime})`;
  const parentBlock = await logseq.Editor.appendBlockInPage(page.uuid, header);
  if (!parentBlock) return;

  if (session.focus) {
    await logseq.Editor.insertBlock(
      parentBlock.uuid,
      `Focus: ${session.focus}`,
      { sibling: false }
    );
  }

  if (session.completed.length > 0) {
    const block = await logseq.Editor.insertBlock(
      parentBlock.uuid,
      "Completed:",
      { sibling: false }
    );
    if (block) {
      for (const todo of session.completed) {
        await logseq.Editor.insertBlock(block.uuid, todo.content, {
          sibling: false,
        });
      }
    }
  }

  if (session.progress.length > 0) {
    const block = await logseq.Editor.insertBlock(
      parentBlock.uuid,
      "Progress:",
      { sibling: false }
    );
    if (block) {
      for (const entry of session.progress) {
        await logseq.Editor.insertBlock(block.uuid, entry.content, {
          sibling: false,
        });
      }
    }
  }

}

export async function logDailySummary(
  totalSessions: number,
  totalFocusMinutes: number,
  totalCompleted: number,
  totalInProgress: number
): Promise<void> {
  const pageName = todayJournalName();
  let page = await logseq.Editor.getPage(pageName);
  if (!page) return;

  const parentBlock = await logseq.Editor.appendBlockInPage(
    page.uuid,
    "Pomodoro Summary"
  );
  if (!parentBlock) return;

  await logseq.Editor.insertBlock(
    parentBlock.uuid,
    `Total sessions: ${totalSessions}`,
    { sibling: false }
  );
  await logseq.Editor.insertBlock(
    parentBlock.uuid,
    `Focus time: ${totalFocusMinutes} minutes`,
    { sibling: false }
  );
  await logseq.Editor.insertBlock(
    parentBlock.uuid,
    `Completed: ${totalCompleted}`,
    { sibling: false }
  );
  if (totalInProgress > 0) {
    await logseq.Editor.insertBlock(
      parentBlock.uuid,
      `In progress: ${totalInProgress}`,
      { sibling: false }
    );
  }
}
