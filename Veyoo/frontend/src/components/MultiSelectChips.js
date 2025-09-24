import React from 'react';

function MultiSelectChips({ options, selectedValues, onChange, label }) {
  const toggleValue = (value) => {
    const isSelected = selectedValues.includes(value);
    const next = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(next);
  };

  return (
    <div className="mb-3">
      {label && (
        <div className="text-sm text-gray-600 mb-1">{label}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleValue(opt)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MultiSelectChips;
