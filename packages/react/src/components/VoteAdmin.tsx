import { useState } from 'react';

import { useDeployVote } from '../hooks/useDeployVote';
import type { EligibilityMode, VoteConfig } from '../types';

type DraftConfig = Omit<VoteConfig, 'voteId' | 'contractAddress'>;

export interface VoteAdminProps {
  onDeployed: (config: VoteConfig) => void;
}

const MAX_OPTIONS = 8;

type StepId = 'title' | 'options' | 'eligibility' | 'timing' | 'quorum' | 'preview';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'options', label: 'Options' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'timing', label: 'Timing' },
  { id: 'quorum', label: 'Quorum' },
  { id: 'preview', label: 'Review' },
];

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
  const [draft, setDraft] = useState<DraftConfig>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const { deploy, status, error } = useDeployVote();

  const step = STEPS[stepIndex];
  if (!step) {
    return <></>;
  }
  const submitting = status === 'deploying';

  const setField = <K extends keyof DraftConfig>(key: K, value: DraftConfig[K]): void => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const stepError = validateStep(step.id, draft);
  const canAdvance = stepError === null;

  const goNext = (): void => {
    if (!canAdvance) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goBack = (): void => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleDeploy = async (): Promise<void> => {
    const cleaned: DraftConfig = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      options: draft.options.map((o) => o.trim()).filter((o) => o.length > 0),
    };
    const deployed = await deploy(cleaned);
    if (deployed) {
      onDeployed(deployed);
    }
  };

  return (
    <form
      className="apv-admin"
      onSubmit={(event) => {
        event.preventDefault();
        if (step.id === 'preview') {
          void handleDeploy();
        } else {
          goNext();
        }
      }}
    >
      <Stepper steps={STEPS} current={stepIndex} />

      {step.id === 'title' ? (
        <TitleStep draft={draft} setField={setField} disabled={submitting} />
      ) : null}
      {step.id === 'options' ? (
        <OptionsStep draft={draft} setDraft={setDraft} disabled={submitting} />
      ) : null}
      {step.id === 'eligibility' ? (
        <EligibilityStep
          draft={draft}
          setDraft={setDraft}
          setField={setField}
          disabled={submitting}
        />
      ) : null}
      {step.id === 'timing' ? (
        <TimingStep draft={draft} setField={setField} disabled={submitting} />
      ) : null}
      {step.id === 'quorum' ? (
        <QuorumStep draft={draft} setField={setField} disabled={submitting} />
      ) : null}
      {step.id === 'preview' ? <PreviewStep draft={draft} /> : null}

      {stepError ? (
        <p className="apv-admin__hint" role="status">
          {stepError}
        </p>
      ) : null}

      {error ? (
        <p className="apv-admin__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="apv-admin__nav">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0 || submitting}
        >
          Back
        </button>
        {step.id === 'preview' ? (
          <button type="submit" className="apv-admin__deploy" disabled={submitting}>
            {submitting ? 'Deploying...' : 'Deploy vote'}
          </button>
        ) : (
          <button type="submit" disabled={!canAdvance || submitting}>
            Next
          </button>
        )}
      </div>
    </form>
  );
}

function validateStep(step: StepId, draft: DraftConfig): string | null {
  if (step === 'title') {
    if (draft.title.trim().length === 0) return 'Add a title for the vote.';
    return null;
  }
  if (step === 'options') {
    const filled = draft.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (filled.length < 2) return 'Add at least two options.';
    if (new Set(filled).size !== filled.length) return 'Options must be unique.';
    return null;
  }
  if (step === 'eligibility') {
    if (draft.eligibilityMode === 'token') {
      if (!draft.tokenAddress) return 'Enter the token address.';
      if (!draft.minTokenBalance) return 'Enter the minimum token balance.';
    }
    if (draft.eligibilityMode === 'allowlist' && !draft.allowlistRoot) {
      return 'Enter the allowlist Merkle root.';
    }
    return null;
  }
  if (step === 'timing') {
    if (draft.endTime <= draft.startTime) return 'End time must be after start time.';
    return null;
  }
  if (step === 'quorum') {
    if (!Number.isFinite(draft.quorum) || draft.quorum < 1) {
      return 'Quorum must be at least 1.';
    }
    return null;
  }
  return null;
}

function Stepper({
  steps,
  current,
}: {
  steps: { id: StepId; label: string }[];
  current: number;
}): JSX.Element {
  return (
    <ol className="apv-admin__stepper">
      {steps.map((s, i) => {
        const stateClass =
          i < current
            ? 'apv-admin__step--done'
            : i === current
              ? 'apv-admin__step--active'
              : 'apv-admin__step--pending';
        return (
          <li key={s.id} className={`apv-admin__step ${stateClass}`}>
            <span className="apv-admin__step-index">{i + 1}</span>
            <span className="apv-admin__step-label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

interface StepProps {
  draft: DraftConfig;
  setField: <K extends keyof DraftConfig>(key: K, value: DraftConfig[K]) => void;
  disabled: boolean;
}

function TitleStep({ draft, setField, disabled }: StepProps): JSX.Element {
  return (
    <fieldset className="apv-admin__section" disabled={disabled}>
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
          rows={4}
        />
      </label>
    </fieldset>
  );
}

interface OptionsStepProps {
  draft: DraftConfig;
  setDraft: React.Dispatch<React.SetStateAction<DraftConfig>>;
  disabled: boolean;
}

function OptionsStep({ draft, setDraft, disabled }: OptionsStepProps): JSX.Element {
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

  return (
    <fieldset className="apv-admin__section" disabled={disabled}>
      <legend>Options (up to {MAX_OPTIONS})</legend>
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
  );
}

interface EligibilityStepProps extends StepProps {
  setDraft: React.Dispatch<React.SetStateAction<DraftConfig>>;
}

function EligibilityStep({
  draft,
  setDraft,
  disabled,
}: EligibilityStepProps): JSX.Element {
  const setMode = (mode: EligibilityMode): void => {
    setDraft((prev) => {
      const { tokenAddress, minTokenBalance, allowlistRoot, ...rest } = prev;
      const next: DraftConfig = { ...rest, eligibilityMode: mode };
      if (mode === 'token') {
        next.tokenAddress = tokenAddress ?? '';
        next.minTokenBalance = minTokenBalance ?? '';
      }
      if (mode === 'allowlist') {
        next.allowlistRoot = allowlistRoot ?? '';
      }
      return next;
    });
  };

  return (
    <fieldset className="apv-admin__section" disabled={disabled}>
      <legend>Who can vote?</legend>
      <label>
        <span>Eligibility</span>
        <select
          value={draft.eligibilityMode}
          onChange={(event) => setMode(event.target.value as EligibilityMode)}
        >
          <option value="open">Anyone</option>
          <option value="token">Token holders</option>
          <option value="allowlist">Address list</option>
        </select>
      </label>

      {draft.eligibilityMode === 'token' ? (
        <>
          <label>
            <span>Token address</span>
            <input
              type="text"
              value={draft.tokenAddress ?? ''}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, tokenAddress: event.target.value }))
              }
              placeholder="0x..."
            />
          </label>
          <label>
            <span>Minimum balance</span>
            <input
              type="text"
              value={draft.minTokenBalance ?? ''}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, minTokenBalance: event.target.value }))
              }
              placeholder="1"
            />
          </label>
        </>
      ) : null}

      {draft.eligibilityMode === 'allowlist' ? (
        <label>
          <span>Allowlist Merkle root</span>
          <input
            type="text"
            value={draft.allowlistRoot ?? ''}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, allowlistRoot: event.target.value }))
            }
            placeholder="0x..."
          />
        </label>
      ) : null}
    </fieldset>
  );
}

function TimingStep({ draft, setField, disabled }: StepProps): JSX.Element {
  return (
    <fieldset className="apv-admin__section" disabled={disabled}>
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
  );
}

function QuorumStep({ draft, setField, disabled }: StepProps): JSX.Element {
  return (
    <fieldset className="apv-admin__section" disabled={disabled}>
      <legend>Quorum</legend>
      <label>
        <span>Minimum votes for a valid result</span>
        <input
          type="number"
          min={1}
          value={draft.quorum}
          onChange={(event) => setField('quorum', Number(event.target.value))}
        />
      </label>
    </fieldset>
  );
}

function PreviewStep({ draft }: { draft: DraftConfig }): JSX.Element {
  const filledOptions = draft.options.map((o) => o.trim()).filter((o) => o.length > 0);
  return (
    <section className="apv-admin__section">
      <h3 className="apv-admin__preview-title">Review your vote</h3>
      <dl className="apv-admin__preview">
        <dt>Title</dt>
        <dd>{draft.title || '-'}</dd>
        <dt>Description</dt>
        <dd>{draft.description || '-'}</dd>
        <dt>Options</dt>
        <dd>
          <ol>
            {filledOptions.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ol>
        </dd>
        <dt>Eligibility</dt>
        <dd>{describeEligibility(draft)}</dd>
        <dt>Start</dt>
        <dd>{new Date(draft.startTime).toLocaleString()}</dd>
        <dt>End</dt>
        <dd>{new Date(draft.endTime).toLocaleString()}</dd>
        <dt>Quorum</dt>
        <dd>{draft.quorum}</dd>
      </dl>
    </section>
  );
}

function describeEligibility(draft: DraftConfig): string {
  if (draft.eligibilityMode === 'open') return 'Anyone can vote';
  if (draft.eligibilityMode === 'token') {
    return `Token holders of ${draft.tokenAddress ?? '?'} with at least ${
      draft.minTokenBalance ?? '?'
    }`;
  }
  return `Allowlist (root ${draft.allowlistRoot ?? '?'})`;
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
