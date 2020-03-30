import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Tooltip,
  Cell,
} from 'recharts';

import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import markdownDatasets from '../markdownDatasets';

const objectFlip = obj => {
  const flip = {};
  Object.keys(obj).forEach(key => {
    flip[obj[key]] = key;
  });
  return flip;
};

//eslint-disable-next-line
const X = ({ layout }) => {
  if (layout === 'vertical') {
    return <XAxis type="number" dataKey="results" />;
  }
  return <XAxis dataKey="label" label="" />;
};

//eslint-disable-next-line
const Y = ({ layout }) => {
  if (layout === 'vertical') {
    return <YAxis width={200} type="category" dataKey="label" />;
  }
  return <YAxis />;
};

export const BarChartComponent = props => {
  const {
    excludeZero,
    maxCategories,
    layout,
    property,
    data,
    classname,
    context,
    thesauris,
    colors,
    labelsMap: rawLabelsMap,
  } = props;
  let output = <Loader />;

  if (data) {
    const sliceColors = colors.split(',');
    const aggregateOthers = props.aggregateOthers === 'true';
    const labelsMap = JSON.parse(rawLabelsMap);
    const labelsMapFlipped = objectFlip(labelsMap);

    const formattedData = arrayUtils.sortValues(
      arrayUtils.formatDataForChart(data, property, thesauris, {
        excludeZero: Boolean(excludeZero),
        context,
        maxCategories,
        aggregateOthers,
        labelsMap,
      })
    );

    output = (
      <ResponsiveContainer height={320}>
        <BarChart height={300} data={formattedData} layout={layout}>
          {X({ layout })}
          {Y({ layout })}

          <CartesianGrid strokeDasharray="2 4" />
          <Tooltip
            labelFormatter={value => {
              return labelsMapFlipped[value] || value;
            }}
          />
          <Bar dataKey="results" fill="rgb(30, 28, 138)" stackId="unique">
            {formattedData.map((_entry, index) => (
              <Cell
                // eslint-disable-next-line react/no-array-index-key
                key={`cell-${index}`}
                cursor="pointer"
                fill={sliceColors[index % sliceColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`BarChart ${classname}`}>{output}</div>;
};

BarChartComponent.defaultProps = {
  context: 'System',
  excludeZero: false,
  layout: 'horizontal',
  maxCategories: '0',
  aggregateOthers: 'false',
  classname: '',
  data: null,
  colors: '#1e1c8a',
  labelsMap: '{}',
};

BarChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  excludeZero: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  classname: PropTypes.string,
  layout: PropTypes.string,
  maxCategories: PropTypes.string,
  aggregateOthers: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
  colors: PropTypes.string,
  labelsMap: PropTypes.string,
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(BarChartComponent);
