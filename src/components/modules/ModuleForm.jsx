import { useRef, useState } from 'react';
import { ImagePlus, ImageUp, Plus, Trash2, X } from 'lucide-react';
import Button from '../common/Button.jsx';
import { ICON_OPTIONS } from '../common/IconResolver.jsx';
import { MODULE_CATEGORIES } from '../../data/terModules.js';
import { TER_APP_URL } from '../../data/appLinks.js';
import { ROLES } from '../../data/roles.js';
import { imageFileToDataUrl } from '../../utils/imageFile.js';
import { apiUrl } from '../../services/api.js';

// Form used by AddModule and EditModule. Steps, rules and workflow are entered
// one per line and converted to arrays on submit. Content sections are edited
// as heading + content (+ optional bullets and image) blocks.

let sectionKeyCounter = 0;

function createSectionKey() {
  sectionKeyCounter += 1;
  return `s${sectionKeyCounter}`;
}

function toFormSection(section) {
  return {
    key: createSectionKey(),
    title: section.title || '',
    content: (section.paragraphs || []).join('\n\n'),
    bullets: (section.bullets || []).join('\n'),
    image: section.image || null,
    imagePlaceholder: section.imagePlaceholder || null,
  };
}

function toLines(value) {
  return (value || '')
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

function toParagraphs(value) {
  return (value || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const initialState = {
  title: '',
  shortDescription: '',
  category: MODULE_CATEGORIES[0],
  audience: ['employee'],
  icon: ICON_OPTIONS[0],
  status: 'Available',
  liveUrl: TER_APP_URL,
  summary: '',
  purpose: '',
  steps: '',
  rules: '',
  example: '',
  workflow: '',
  sections: [],
};

export default function ModuleForm({ initialValues, submitLabel = 'Save module', onSubmit, onCancel }) {
  const [values, setValues] = useState(() => {
    const base = initialValues
      ? {
          ...initialState,
          ...initialValues,
          title: initialValues.title || '',
          shortDescription: initialValues.shortDescription || '',
          summary: initialValues.summary || '',
          purpose: initialValues.purpose || '',
          example: initialValues.example || '',
          liveUrl: initialValues.liveUrl || '',
          audience: initialValues.audience || ['employee'],
          steps: (initialValues.steps || []).join('\n'),
          rules: (initialValues.rules || []).join('\n'),
          workflow: (initialValues.workflow || []).join('\n'),
        }
      : { ...initialState };

    return {
      ...base,
      sections: (initialValues?.sections || []).map(toFormSection),
    };
  });
  const [error, setError] = useState('');
  const [imageBusyKey, setImageBusyKey] = useState(null);
  const [imageError, setImageError] = useState(null);
  const imageInputRef = useRef(null);
  const imageTargetRef = useRef(null);

  const update = (field) => (event) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const toggleAudience = (roleId) => {
    setValues((previous) => {
      const has = previous.audience.includes(roleId);
      const next = has
        ? previous.audience.filter((item) => item !== roleId)
        : [...previous.audience, roleId];
      return { ...previous, audience: next };
    });
  };

  const addSection = () => {
    setValues((previous) => ({
      ...previous,
      sections: [
        ...previous.sections,
        { key: createSectionKey(), title: '', content: '', bullets: '', image: null, imagePlaceholder: null },
      ],
    }));
  };

  const updateSection = (key, field) => (event) => {
    const value = event.target.value;
    setValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.key === key ? { ...section, [field]: value } : section
      ),
    }));
  };

  const removeSection = (key) => {
    setValues((previous) => ({
      ...previous,
      sections: previous.sections.filter((section) => section.key !== key),
    }));
  };

  const openSectionImagePicker = (key) => {
    imageTargetRef.current = key;
    imageInputRef.current?.click();
  };

  const handleSectionImageSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const key = imageTargetRef.current;
    if (!file || !key) {
      return;
    }
    setImageBusyKey(key);
    setImageError(null);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setValues((previous) => ({
        ...previous,
        sections: previous.sections.map((section) =>
          section.key === key ? { ...section, image: dataUrl, imagePlaceholder: null } : section
        ),
      }));
    } catch (uploadError) {
      setImageError({ key, message: uploadError.message || 'Image could not be uploaded.' });
    } finally {
      setImageBusyKey(null);
    }
  };

  const removeSectionImage = (key) => {
    setValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.key === key ? { ...section, image: null } : section
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!values.title.trim()) {
      setError('Module title is required.');
      return;
    }
    if (!values.shortDescription.trim()) {
      setError('Short description is required.');
      return;
    }
    if (values.audience.length === 0) {
      setError('Select at least one audience role.');
      return;
    }
    const missingHeading = values.sections.findIndex((section) => {
      const hasContent = section.content.trim() || section.bullets.trim() || section.image;
      return hasContent && !section.title.trim();
    });
    if (missingHeading >= 0) {
      setError(`Section ${missingHeading + 1} needs a heading.`);
      return;
    }
    setError('');

    onSubmit({
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim(),
      category: values.category,
      audience: values.audience,
      icon: values.icon,
      status: values.status,
      liveUrl: values.liveUrl.trim() ? values.liveUrl.trim() : null,
      summary: values.summary.trim() || values.shortDescription.trim(),
      purpose: values.purpose.trim() || values.shortDescription.trim(),
      steps: toLines(values.steps),
      rules: toLines(values.rules),
      example: values.example.trim(),
      workflow: toLines(values.workflow),
      sections: values.sections
        .map((section) => ({
          title: section.title.trim(),
          paragraphs: toParagraphs(section.content),
          bullets: toLines(section.bullets),
          image: section.image || null,
          imagePlaceholder: section.imagePlaceholder || null,
        }))
        .filter(
          (section) =>
            section.title ||
            section.paragraphs.length ||
            section.bullets.length ||
            section.image ||
            section.imagePlaceholder
        ),
    });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none';
  const labelClass = 'text-xs font-medium text-slate-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="module-title" className={labelClass}>
            Module title *
          </label>
          <input
            id="module-title"
            type="text"
            value={values.title}
            onChange={update('title')}
            placeholder="e.g. Expense Limits"
            className={inputClass}
            required
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="module-short" className={labelClass}>
            Short description *
          </label>
          <input
            id="module-short"
            type="text"
            value={values.shortDescription}
            onChange={update('shortDescription')}
            placeholder="One line summary shown on the module card"
            className={inputClass}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-category" className={labelClass}>
            Category
          </label>
          <select
            id="module-category"
            value={values.category}
            onChange={update('category')}
            className={inputClass}
          >
            {MODULE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-icon" className={labelClass}>
            Icon
          </label>
          <select id="module-icon" value={values.icon} onChange={update('icon')} className={inputClass}>
            {ICON_OPTIONS.map((iconName) => (
              <option key={iconName} value={iconName}>
                {iconName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-status" className={labelClass}>
            Status badge
          </label>
          <select
            id="module-status"
            value={values.status}
            onChange={update('status')}
            className={inputClass}
          >
            <option value="Available">Available</option>
            <option value="Important">Important</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-url" className={labelClass}>
            TER app link
          </label>
          <input
            id="module-url"
            type="url"
            value={values.liveUrl}
            onChange={update('liveUrl')}
            placeholder="https://play.google.com/store/apps/details?id=com.portal.ter"
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-xs font-medium text-slate-600">Audience / roles *</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {ROLES.map((role) => (
            <label key={role.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={values.audience.includes(role.id)}
                onChange={() => toggleAudience(role.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {role.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="module-summary" className={labelClass}>
          Summary
        </label>
        <textarea
          id="module-summary"
          rows={3}
          value={values.summary}
          onChange={update('summary')}
          placeholder="What this module covers, in two or three sentences."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="module-purpose" className={labelClass}>
          Purpose
        </label>
        <textarea
          id="module-purpose"
          rows={2}
          value={values.purpose}
          onChange={update('purpose')}
          placeholder="Why this module exists."
          className={inputClass}
        />
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-xs font-medium text-slate-600">Content sections</legend>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Upload section image"
          onChange={handleSectionImageSelect}
        />
        <p className="mt-1 text-xs text-slate-500">
          Add a heading and its content. If the section needs a picture, add an image after the
          content - otherwise leave it out. Unused sections and images can be deleted.
        </p>

        {values.sections.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            No content sections yet. Click &quot;Add section&quot; to start.
          </p>
        ) : null}

        <div className="mt-3 space-y-4">
          {values.sections.map((section, index) => (
            <div key={section.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Section {index + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => removeSection(section.key)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete section
                </Button>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <label htmlFor={`section-${section.key}-title`} className={labelClass}>
                  Heading
                </label>
                <input
                  id={`section-${section.key}-title`}
                  type="text"
                  value={section.title}
                  onChange={updateSection(section.key, 'title')}
                  placeholder="e.g. Claim period window"
                  className={inputClass}
                />
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <label htmlFor={`section-${section.key}-content`} className={labelClass}>
                  Content
                </label>
                <textarea
                  id={`section-${section.key}-content`}
                  rows={4}
                  value={section.content}
                  onChange={updateSection(section.key, 'content')}
                  placeholder="Write the section content. Leave a blank line to start a new paragraph."
                  className={inputClass}
                />
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <label htmlFor={`section-${section.key}-bullets`} className={labelClass}>
                  Bullet points (optional, one per line)
                </label>
                <textarea
                  id={`section-${section.key}-bullets`}
                  rows={3}
                  value={section.bullets}
                  onChange={updateSection(section.key, 'bullets')}
                  placeholder={'First point\nSecond point'}
                  className={inputClass}
                />
              </div>

              <div className="mt-3">
                {section.image ? (
                  <div className="space-y-2">
                    <img
                      src={apiUrl(section.image)}
                      alt={`Preview for section ${index + 1}`}
                      className="h-40 w-full rounded-lg border border-slate-200 object-cover"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openSectionImagePicker(section.key)}
                        disabled={imageBusyKey === section.key}
                      >
                        <ImageUp className="h-3.5 w-3.5" aria-hidden="true" />
                        {imageBusyKey === section.key ? 'Uploading...' : 'Change image'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removeSectionImage(section.key)}
                        disabled={imageBusyKey === section.key}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openSectionImagePicker(section.key)}
                    disabled={imageBusyKey === section.key}
                  >
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    {imageBusyKey === section.key ? 'Uploading...' : 'Add image after content'}
                  </Button>
                )}
                {imageError?.key === section.key ? (
                  <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {imageError.message}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <Button size="sm" variant="secondary" className="mt-3" onClick={addSection}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add section
        </Button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="module-steps" className={labelClass}>
            Steps (one per line)
          </label>
          <textarea
            id="module-steps"
            rows={6}
            value={values.steps}
            onChange={update('steps')}
            placeholder={'Select the claim period\nSelect the expense category\nEnter the bill details'}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-rules" className={labelClass}>
            Business rules (one per line)
          </label>
          <textarea
            id="module-rules"
            rows={6}
            value={values.rules}
            onChange={update('rules')}
            placeholder={'Claimable amount cannot exceed bill amount\nPending claims cannot be edited'}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-workflow" className={labelClass}>
            Workflow / status flow (one per line)
          </label>
          <textarea
            id="module-workflow"
            rows={5}
            value={values.workflow}
            onChange={update('workflow')}
            placeholder={'Employee\nSupervisor L1\nSupervisor L2'}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="module-example" className={labelClass}>
            Example
          </label>
          <textarea
            id="module-example"
            rows={5}
            value={values.example}
            onChange={update('example')}
            placeholder="A short worked example for readers."
            className={inputClass}
          />
        </div>
      </div>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        This card, its content sections and their images are saved on the portal server and
        published to every visitor of the portal. Only the administrator can add, edit or delete
        cards.
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
