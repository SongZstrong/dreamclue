import {
  Banner,
  DynamicCodeBlock,
  File,
  Files,
  Folder,
  InlineTOC,
} from '@/components/docs/lazy';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card } from 'fumadocs-ui/components/card';
import { Heading } from 'fumadocs-ui/components/heading';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';

export function heading(): ReactNode {
  return (
    <Wrapper>
      <div className="rounded-lg bg-fd-background p-4 prose-no-margin">
        <Heading id="preview" as="h3">
          Dream Symbol Preview
        </Heading>
        <Heading id="preview" as="h3">
          Reading a <code>Moon</code> Dream
        </Heading>
      </div>
    </Wrapper>
  );
}

export function card(): ReactNode {
  return (
    <Wrapper>
      <div className="rounded-lg bg-fd-background">
        <Card
          href="#"
          icon={<Home />}
          title="Dream Journal Basics"
          description="Learn how to record symbols, emotions, and context before interpretation"
        />
      </div>
    </Wrapper>
  );
}

export function tabs(): ReactNode {
  return (
    <Wrapper>
      <div className="space-y-4 rounded-xl bg-fd-background p-4 text-sm">
        <Tabs
          groupId="dream-entry"
          persist
          items={['Memory', 'Symbols', 'Reflection']}
        >
          <Tab value="Memory">Capture scenes before details fade.</Tab>
          <Tab value="Symbols">Mark people, places, objects, and actions.</Tab>
          <Tab value="Reflection">Connect the dream to waking emotions.</Tab>
        </Tabs>

        <Tabs groupId="dream-entry" persist items={['Memory', 'Symbols']}>
          <Tab value="Memory">
            The selected dream note view stays consistent after refresh.
          </Tab>
          <Tab value="Symbols">
            Symbol notes can be reviewed alongside the original dream.
          </Tab>
        </Tabs>
      </div>
    </Wrapper>
  );
}

export function typeTable(): ReactNode {
  return (
    <Wrapper>
      <div className="rounded-xl bg-fd-background">
        <TypeTable
          type={{
            symbolWeight: {
              description:
                'How strongly a symbol appears in the dream narrative',
              type: 'number',
              default: '0.8',
            },
            emotionalTone: {
              description: 'The primary feeling attached to the dream',
              type: 'string',
              default: 'curious',
            },
          }}
        />
      </div>
    </Wrapper>
  );
}

export function accordion(): ReactNode {
  return (
    <Wrapper>
      <Accordions type="single" collapsible>
        <Accordion id="dream-symbols" title="How should I read a symbol?">
          Start with the dreamer's context, then compare common meanings.
        </Accordion>
        <Accordion id="dream-context" title="Why does context matter?">
          The same image can point to different emotions in different lives.
        </Accordion>
      </Accordions>
    </Wrapper>
  );
}

export function callout(): ReactNode {
  return (
    <Wrapper>
      <Callout title="Dream note">
        Record the first feeling you remember before polishing the story.
      </Callout>
    </Wrapper>
  );
}

export function files(): ReactNode {
  return (
    <Wrapper>
      <Files>
        <Folder name="dream-journal" defaultOpen>
          <Folder name="entries" defaultOpen>
            <File name="flying-over-water.mdx" />
          </Folder>
          <File name="symbols.mdx" />
          <File name="moods.mdx" />
          <File name="reflections.mdx" />
        </Folder>
        <Folder name="knowledge-base">
          <File name="water.md" />
          <File name="doors.md" />
          <File name="nightmares.md" />
          <Folder name="personal-symbols" />
        </Folder>
        <File name="interpretation-notes.md" />
      </Files>
    </Wrapper>
  );
}

export function inlineTOC(): ReactNode {
  return (
    <Wrapper>
      <InlineTOC
        items={[
          { title: 'Dream Overview', url: '#dream-overview', depth: 2 },
          { title: 'Remember the Scene', url: '#remember', depth: 3 },
          { title: 'Mark Symbols', url: '#symbols', depth: 3 },
          { title: 'Add Emotions', url: '#emotions', depth: 3 },
          { title: 'Interpretation Notes', url: '#notes', depth: 2 },
          { title: 'Recurring Patterns', url: '#patterns', depth: 3 },
          { title: 'Nightmare Care', url: '#nightmares', depth: 3 },
          { title: 'Journal Prompts', url: '#prompts', depth: 2 },
        ]}
      />
    </Wrapper>
  );
}

export function steps(): ReactNode {
  return (
    <Wrapper>
      <div className="rounded-xl bg-fd-background p-3">
        <Steps>
          <Step>
            <h4>Record the dream</h4>
            <p>Write scenes, people, places, and emotions in plain language.</p>
          </Step>
          <Step>
            <h4>Identify recurring symbols</h4>
            <p>Link the dream to symbols already saved in the journal.</p>
          </Step>
          <Step>
            <h4>Review the interpretation</h4>
            <p>Compare common meanings with personal context before saving.</p>
          </Step>
        </Steps>
      </div>
    </Wrapper>
  );
}

export function dynamicCodeBlock() {
  return (
    <Wrapper>
      <DynamicCodeBlock />
    </Wrapper>
  );
}

export function banner(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col gap-4">
        <Banner className="z-0" changeLayout={false}>
          New dream-symbol clustering is available for recent journal entries.
        </Banner>

        <Banner
          className="z-0"
          id="test-rainbow"
          variant="rainbow"
          changeLayout={false}
        >
          Highlight dreams that share the same <code>emotion</code> pattern.
        </Banner>

        <Banner className="z-0" id="test" changeLayout={false}>
          Save a reflection after each interpretation to improve future notes.
        </Banner>
      </div>
    </Wrapper>
  );
}
