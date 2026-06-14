'use client';

import * as Kanban from '@/components/diceui/kanban';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import * as React from 'react';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  assignee?: string;
  dueDate?: string;
}

const COLUMN_TITLES: Record<string, string> = {
  backlog: 'Next',
  inProgress: 'In Progress',
  done: 'Released',
};

export function Roadmap() {
  const [columns, setColumns] = React.useState<Record<string, Task[]>>({
    backlog: [
      {
        id: '1',
        title: 'Dream symbol comparison view',
        priority: 'high',
        assignee: 'Dream Research',
        dueDate: '2026-07-01',
      },
      {
        id: '2',
        title: 'Weekly dream insight summary',
        priority: 'medium',
        assignee: 'AI Analysis',
        dueDate: '2026-07-15',
      },
      {
        id: '3',
        title: 'Expanded cultural symbol library',
        priority: 'low',
        assignee: 'Knowledge Base',
        dueDate: '2026-08-01',
      },
    ],
    inProgress: [
      {
        id: '4',
        title: 'Recurring dream pattern detection',
        priority: 'high',
        assignee: 'Dream Journal',
        dueDate: '2026-06-24',
      },
      {
        id: '5',
        title: 'Mood timeline improvements',
        priority: 'medium',
        assignee: 'Insights',
        dueDate: '2026-06-30',
      },
    ],
    done: [
      {
        id: '7',
        title: 'Private dream journal',
        priority: 'high',
        assignee: 'Core App',
        dueDate: '2026-05-01',
      },
      {
        id: '8',
        title: 'AI dream interpretation search',
        priority: 'low',
        assignee: 'Dreambook',
        dueDate: '2026-05-15',
      },
    ],
  });

  return (
    <Kanban.Root
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item) => item.id}
    >
      <Kanban.Board className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(columns).map(([columnValue, tasks]) => (
          <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
        ))}
      </Kanban.Board>
      <Kanban.Overlay>
        {({ value, variant }) => {
          if (variant === 'column') {
            const tasks = columns[value] ?? [];

            return <TaskColumn value={value} tasks={tasks} />;
          }

          const task = Object.values(columns)
            .flat()
            .find((task) => task.id === value);

          if (!task) return null;

          return <TaskCard task={task} />;
        }}
      </Kanban.Overlay>
    </Kanban.Root>
  );
}

interface TaskCardProps
  extends Omit<React.ComponentProps<typeof Kanban.Item>, 'value'> {
  task: Task;
}

function TaskCard({ task, ...props }: TaskCardProps) {
  return (
    <Kanban.Item key={task.id} value={task.id} asChild {...props}>
      <div className="rounded-md border bg-card p-3 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 font-medium text-sm">
              {task.title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize border-transparent',
                task.priority === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  : task.priority === 'medium'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              )}
            >
              {task.priority}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary/20" />
                <span className="line-clamp-1">{task.assignee}</span>
              </div>
            )}
            {task.dueDate && (
              <time className="text-[10px] tabular-nums">{task.dueDate}</time>
            )}
          </div>
        </div>
      </div>
    </Kanban.Item>
  );
}

interface TaskColumnProps
  extends Omit<React.ComponentProps<typeof Kanban.Column>, 'children'> {
  tasks: Task[];
}

function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  return (
    <Kanban.Column value={value} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary" className="pointer-events-none rounded-sm">
            {tasks.length}
          </Badge>
        </div>
        <Kanban.ColumnHandle asChild>
          <Button variant="ghost" size="icon">
            <GripVertical className="h-4 w-4" />
          </Button>
        </Kanban.ColumnHandle>
      </div>
      <div className="flex flex-col gap-2 p-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle />
        ))}
      </div>
    </Kanban.Column>
  );
}
