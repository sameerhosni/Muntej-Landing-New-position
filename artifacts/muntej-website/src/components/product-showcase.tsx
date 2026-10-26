import { useId, useRef, useState } from 'react';
import type { Lang, Translation } from '@/translations';

type Props = { copy: Translation['showcase']; lang: Lang };
type Screen = Translation['showcase']['items'][number];

export function ProductShowcase({ copy, lang }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Screen | null>(null);
  const titleId = useId();
  const source = (screen: Screen) =>
    `${import.meta.env.BASE_URL}screens/muntej-${screen.key}-${lang}.webp`;

  function open(screen: Screen) {
    setSelected(screen);
    dialog.current?.showModal();
  }

  return (
    <section className="m-section m-showcase" id="screens">
      <span id="gallery" className="m-anchor-alias" aria-hidden="true" />
      <div className="m-wrap">
        <span className="m-eyebrow">{copy.eyebrow}</span>
        <h2 className="m-h2">{copy.title}</h2>
        <p className="m-lead">{copy.intro}</p>
        <p className="m-note">{copy.disclaimer}</p>
        <div className="m-shots">
          {copy.items.map((screen, index) => (
            <figure key={screen.key} className="m-shot" data-testid={`shot-${screen.key}`}>
              <button
                type="button"
                className="m-shot-open"
                onClick={() => open(screen)}
                aria-label={`${copy.openScreen}: ${screen.title}`}
                aria-haspopup="dialog"
              >
                <span className="m-tag">{copy.badge}</span>
                <img src={source(screen)} alt={screen.alt} width={585} height={1266} loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
                <span className="m-shot-zoom">{copy.openScreen}<span aria-hidden="true"> ↗</span></span>
              </button>
              <figcaption><b>{screen.title}</b><span>{screen.description}</span></figcaption>
            </figure>
          ))}
        </div>
        <h3 className="m-example-title">{copy.exampleTitle}</h3>
        <div className="m-examples">
          <p>{copy.exampleTask}</p>
          <p>{copy.exampleBrief}</p>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="m-screen-dialog"
        aria-labelledby={titleId}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="m-screen-dialog-content">
          <div className="m-screen-dialog-header">
            <h3 id={titleId}>{selected?.title}</h3>
            <button type="button" className="m-lang" autoFocus onClick={() => dialog.current?.close()}>{copy.closeScreen}</button>
          </div>
          <p className="m-note">{copy.disclaimer}</p>
          {selected && <img src={source(selected)} alt={selected.alt} width={585} height={1266} />}
        </div>
      </dialog>
    </section>
  );
}
