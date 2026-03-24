import { OrgAvatar } from './OrgAvatar';

export function OrgPersonIdentity({
  person,
  accent = 'cyan',
  avatarSize = 'md',
  titleClassName = 'text-lg font-semibold text-white',
  subtitleClassName = 'text-sm text-slate-400',
  tertiaryText,
  tertiaryClassName = 'text-xs uppercase tracking-[0.2em] text-slate-500',
  align = 'left',
}) {
  if (!person) {
    return null;
  }

  const isCentered = align === 'center';

  return (
    <div
      className={[
        'flex gap-4',
        isCentered ? 'flex-col items-center text-center' : 'items-center',
      ].join(' ')}
    >
      <OrgAvatar name={person.fullName} size={avatarSize} accent={accent} />
      <div className={isCentered ? 'text-center' : 'min-w-0'}>
        <p className={titleClassName}>{person.fullName}</p>
        <p className={subtitleClassName}>{person.jobTitle || person.role}</p>
        {tertiaryText ? <p className={tertiaryClassName}>{tertiaryText}</p> : null}
      </div>
    </div>
  );
}
