import { useState } from 'react';

import { useDeployVote } from '../hooks/useDeployVote';
import type { EligibilityMode, VoteConfig } from '../types';

type DraftConfig = Omit<VoteConfig, 'voteId' | 'contractAddress'>;

export interface VoteAdminProps {
  onDeployed: (config: VoteConfig) => void;
}

const MAX_OPTIONS = 8;

const initialDraft = (): DraftConfig => ({
  title: '',
  description: '',
  options: ['', ''],
  startTime: Date.now(),
  endTime: Date.now() + 1000 * 60 * 60 * 24 * 7,
  quorum: 1,
  eligibilityMode: 'open',
});

export function VoteAdmin({ onDeployed }: VoteAdminProps): JSX.Element {
  const [draft, setDraft] = useState<DraftConfig>(initialDraft());
  const { deploy, status, error } = useDeployVote();

  const setField = <K extends keyof DraftConfig>(key: K, value: DraftConfig[K]): void => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setOption = (index: number, value: string): void => {
    setDraft((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const addOption = (): void => {
    setDraft((prev) =>
      prev.options.length >= MAX_OPTIONS
        ? prev
        : { ...prev, options: [...prev.options, ''] },
    );
  };

  const removeOption = (index: number): void => {
    setDraft((prev) =>
      prev.options.length <= 2
        ? prev
        : { ...prev, options: prev.options.filter((_, i) => i !== index) },
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const cleaned: DraftConfig = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      options: draft.options.map((o) => o.trim()).filter((o) => o.length > 0),
    };
    if (cleaned.title.length === 0) return;
    if (cleaned.options.length < 2) return;
    if (cleaned.endTime <= cleaned.startTime) return;
    const deployed = await deploy(cleaned);
    if (deployed) {
      onDeployed(deployed);
    }
  };

  const submitting = status === 'deploying';

  return (
    <form className="apv-admin" onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className="apv-admin__section" disabled={submitting}>
        <legend>Title and description</legend>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => setField('title', event.target.value)}
            required
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setField('description', event.target.value)}
            rows={3}
          />
        </label>
      </fieldset>

      <fieldset className="apv-admin__section" disabled={submitting}>
        <legend>Options</legend>
        {draft.options.map((option, index) => (
          <div key={index} className="apv-admin__option-row">
            <input
              type="text"
              value={option}
              onChange={(event) => setOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              disabled={draft.options.length <= 2}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          disabled={draft.options.length >= MAX_OPTIONS}
        >
          Add option
        </button>
      </fieldset>

      <fieldset className="apv-admin__section" disabled={submitting}>
        <legend>Eligibility</legend>
        <EligibilitySelect
          mode={draft.eligibilityMode}
          tokenAddress={draft.tokenAddress ?? ''}
          minTokenBalance={draft.minTokenBalance ?? ''}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        />
      </fieldset>

      <fieldset className="apv-admin__section" disabled={submitting}>
        <legend>Timing</legend>
        <label>
          <span>Start</span>
          <input
            type="datetime-local"
            value={toLocalInput(draft.startTime)}
            onChange={(event) => setField('startTime', fromLocalInput(event.target.value))}
          />
        </label>
        <label>
          <span>End</span>
          <input
            type="datetime-local"
            value={toLocalInput(draft.endTime)}
            onChange={(event) => setField('endTime', fromLocalInput(event.target.value))}
          />
        </label>
      </fieldset>

      <fieldset className="apv-admin__section" disabled={submitting}>
        <legend>Quorum</legend>
        <label>
          <span>Minimum votes for valid result</span>
          <input
            type="number"
            min={1}
            value={draft.quorum}
            onChange={(event) => setField('quorum', Number(event.target.value))}
          />
        </label>
      </fieldset>

      {error ? (
        <p className="apv-admin__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="apv-admin__deploy" disabled={submitting}>
        {submitting ? 'Deploying...' : 'Deploy vote'}
      </button>
    </form>
  );
}

interface EligibilitySelectProps {
  mode: EligibilityMode;
  tokenAddress: string;
  minTokenBalance: string;
  onChange: (patch: Partial<DraftConfig>) => void;
}

function EligibilitySelect({
  mode,
  tokenAddress,
  minTokenBalance,
  onChange,
}: EligibilitySelectProps): JSX.Element {
  return (
    <>
      <label>
        <span>Who can vote?</span>
        <select
          value={mode}
          onChange={(event) =>
            onChange({ eligibilityMode: event.target.value as EligibilityMode })
          }
        >
          <option value="open">Anyone</option>
          <option value="token">Token holders</option>
          <option value="allowlist">Address list</option>
        </select>
      </label>
      {mode === 'token' ? (
        <>
          <label>
            <span>Token address</span>
            <input
              type="text"
              value={tokenAddress}
              onChange={(event) => onChange({ tokenAddress: event.target.value })}
              placeholder="0x..."
            />
          </label>
          <label>
            <span>Minimum balance</span>
            <input
              type="text"
              value={minTokenBalance}
              onChange={(event) => onChange({ minTokenBalance: event.target.value })}
              placeholder="1"
            />
          </label>
        </>
      ) : null}
    </>
  );
}

function toLocalInput(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): number {
  return new Date(value).getTime();
}
