import { useState } from 'react'
import { jerseyProduct } from '../../data/gym.js'

export default function JerseySizeChart() {
  const [unit, setUnit] = useState('cm')
  const { verified, rows } = jerseyProduct.sizeChart
  const unitName = unit === 'cm' ? 'centimetres' : 'inches'
  const measurement = (centimetres) => unit === 'cm' ? centimetres.toFixed(0) : (centimetres / 2.54).toFixed(1)

  return (
    <div className="jersey-size-chart">
      <div className="size-chart-toolbar">
        <span className={verified ? 'size-chart-label' : 'size-chart-label is-provisional'}>
          {verified ? 'Garment measurements' : 'Provisional chart'}
        </span>
        <div className="size-unit-toggle" role="group" aria-label="Measurement units">
          <button type="button" aria-label="Centimetres" aria-pressed={unit === 'cm'} onClick={() => setUnit('cm')}>cm</button>
          <button type="button" aria-label="Inches" aria-pressed={unit === 'in'} onClick={() => setUnit('in')}>in</button>
        </div>
      </div>
      {!verified && (
        <p className="size-chart-notice" id="size-chart-notice">
          <strong>Sample measurements, not verified for this jersey.</strong> Confirm the actual measurements and available sizes with the admin before choosing a size.
        </p>
      )}
      <p className="sr-only" aria-live="polite">Measurements shown in {unitName}.</p>
      <table className="size-chart-table" aria-describedby={verified ? 'size-measuring-note' : 'size-chart-notice size-measuring-note'}>
        <caption>{verified ? 'Garment' : 'Sample garment'} measurements ({unit})</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col"><span>A · Chest width</span><small>laid flat ({unit})</small></th>
            <th scope="col"><span>B · Length</span><small>shoulder to hem ({unit})</small></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size}>
              <th scope="row">{row.size}</th>
              <td>{measurement(row.chestWidth)}</td>
              <td>{measurement(row.length)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="size-measuring-guide">
        <svg viewBox="45 12 250 210" role="img" aria-labelledby="jersey-measure-title jersey-measure-description" className="size-shirt-diagram">
          <title id="jersey-measure-title">How to measure a jersey laid flat</title>
          <desc id="jersey-measure-description">A measures the chest width from armpit to armpit. B measures the length from the highest shoulder point beside the collar to the bottom hem.</desc>
          <path d="M92 36 126 24C128 48 172 48 174 24L208 36 242 82 210 104 196 87V198H104V87L90 104 58 82Z" fill="#eff0e9" stroke="#727967" strokeWidth="2" strokeLinejoin="round" />
          <path d="M126 24C128 58 172 58 174 24M104 187H196" fill="none" stroke="#b1b7a5" strokeWidth="1.5" />
          <path d="M106 112H194M112 107 106 112 112 117M188 107 194 112 188 117" fill="none" stroke="#806500" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="150" cy="91" r="12" fill="#edcc48" /><text x="150" y="95" textAnchor="middle" fill="#171918" fontSize="12" fontWeight="700">A</text>
          <path d="M174 24H274M196 198H274" fill="none" stroke="#b1b7a5" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M265 26V198M260 32 265 26 270 32M260 192 265 198 270 192" fill="none" stroke="#806500" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="265" cy="112" r="12" fill="#edcc48" /><text x="265" y="116" textAnchor="middle" fill="#171918" fontSize="12" fontWeight="700">B</text>
        </svg>
        <div>
          <h4>How to measure</h4>
          <p id="size-measuring-note">Lay a jersey that fits you flat without stretching it. These are garment measurements, not body measurements.</p>
          <dl>
            <div><dt>A · Chest width</dt><dd>Measure straight across, armpit to armpit. This is not the full chest circumference.</dd></div>
            <div><dt>B · Length</dt><dd>Measure from the highest shoulder point beside the collar to the bottom hem.</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}
