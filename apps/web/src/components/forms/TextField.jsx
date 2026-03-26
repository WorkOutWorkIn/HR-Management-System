import { Input as HeroInput, Textarea as HeroTextarea } from '@heroui/react';
import { createContext, forwardRef, useContext, useId, useMemo } from 'react';

const TextFieldContext = createContext(null);

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

function mergeSlotClasses(baseSlots = {}, overrideSlots = {}) {
  const merged = { ...baseSlots };

  Object.entries(overrideSlots).forEach(([slot, value]) => {
    merged[slot] = joinClasses(baseSlots[slot], value);
  });

  return merged;
}

function mergeDescriptions(...values) {
  const tokens = values
    .flatMap((value) => (typeof value === 'string' ? value.split(' ') : []))
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.length ? Array.from(new Set(tokens)).join(' ') : undefined;
}

const defaultInputClassNames = {
  inputWrapper:
    'border-[color:var(--field-border)] bg-[color:var(--field-bg)] shadow-none transition data-[hover=true]:border-[color:var(--field-border-hover)] group-data-[focus=true]:border-[color:var(--field-border-focus)]',
  input: 'text-[color:var(--field-foreground)] placeholder:text-[color:var(--field-placeholder)]',
  innerWrapper: 'gap-2',
};

const defaultTextAreaClassNames = {
  ...defaultInputClassNames,
  input: 'text-white placeholder:text-slate-500',
};

function useTextFieldContext() {
  return useContext(TextFieldContext);
}

export function TextField({
  children,
  className,
  fullWidth = false,
  isInvalid = false,
  isRequired = false,
  name,
  type = 'text',
  variant = 'bordered',
}) {
  const inputId = useId();
  const value = useMemo(
    () => ({
      descriptionId: `${inputId}-description`,
      errorId: `${inputId}-error`,
      fullWidth,
      inputId,
      isInvalid,
      isRequired,
      name,
      type,
      variant,
    }),
    [fullWidth, inputId, isInvalid, isRequired, name, type, variant],
  );

  return (
    <TextFieldContext.Provider value={value}>
      <div className={joinClasses('flex flex-col gap-2', fullWidth ? 'w-full' : '', className)}>
        {children}
      </div>
    </TextFieldContext.Provider>
  );
}

export function Label({ children, className }) {
  const context = useTextFieldContext();

  return (
    <label
      className={joinClasses('text-sm font-medium text-[var(--app-foreground)]', className)}
      htmlFor={context?.inputId}
    >
      {children}
      {context?.isRequired ? <span className="ml-1 text-rose-300">*</span> : null}
    </label>
  );
}

export const Input = forwardRef(function Input(props, ref) {
  const context = useTextFieldContext();
  const resolvedProps = {
    'aria-describedby': mergeDescriptions(
      props['aria-describedby'],
      context?.descriptionId,
      context?.errorId,
    ),
    'aria-errormessage': context?.errorId || props['aria-errormessage'],
    className: joinClasses(context?.fullWidth ? 'w-full' : '', props.className),
    classNames: mergeSlotClasses(defaultInputClassNames, props.classNames),
    id: props.id ?? context?.inputId,
    isInvalid: props.isInvalid ?? context?.isInvalid ?? false,
    isRequired: props.isRequired ?? context?.isRequired ?? false,
    name: props.name ?? context?.name,
    type: props.type ?? context?.type ?? 'text',
    variant: props.variant ?? context?.variant ?? 'bordered',
  };

  return <HeroInput ref={ref} {...props} {...resolvedProps} />;
});

export const TextArea = forwardRef(function TextArea(props, ref) {
  const context = useTextFieldContext();
  const resolvedProps = {
    'aria-describedby': mergeDescriptions(
      props['aria-describedby'],
      context?.descriptionId,
      context?.errorId,
    ),
    'aria-errormessage': context?.errorId || props['aria-errormessage'],
    className: joinClasses(context?.fullWidth ? 'w-full' : '', props.className),
    classNames: mergeSlotClasses(defaultTextAreaClassNames, props.classNames),
    id: props.id ?? context?.inputId,
    isInvalid: props.isInvalid ?? context?.isInvalid ?? false,
    isRequired: props.isRequired ?? context?.isRequired ?? false,
    name: props.name ?? context?.name,
    variant: props.variant ?? context?.variant ?? 'bordered',
  };

  return <HeroTextarea ref={ref} {...props} {...resolvedProps} />;
});

export function Description({ children, className }) {
  const context = useTextFieldContext();

  if (!children) {
    return null;
  }

  return (
    <p
      className={joinClasses('text-xs leading-relaxed text-[var(--app-muted)]', className)}
      id={context?.descriptionId}
    >
      {children}
    </p>
  );
}

export function FieldError({ children, className }) {
  const context = useTextFieldContext();

  if (!children) {
    return null;
  }

  return (
    <p
      className={joinClasses('text-xs font-medium leading-relaxed text-rose-400', className)}
      id={context?.errorId}
      role="alert"
    >
      {children}
    </p>
  );
}
