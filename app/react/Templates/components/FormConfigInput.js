import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField} from 'app/Forms';
import {connect} from 'react-redux';

export class FormConfigInput extends Component {

  render() {
    const {index, data, formState} = this.props;
    const ptoperty = data.properties[index];
    let labelClass = 'input-group';
    let labelKey = `properties.${index}.label`;
    let requiredLabel = formState.errors[labelKey + '.required'];
    let duplicatedLabel = formState.errors[labelKey + '.duplicated'];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className="row">
          <div className="col-sm-6">
            <div className={labelClass}>
              <span className="input-group-addon">
                Label
              </span>
              <FormField model={`template.data.properties[${index}].label`}>
                <input className="form-control" />
              </FormField>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.data.properties[${index}].required`}>
                  <input id={'required' + index} type="checkbox" className="asd"/>
                </FormField>
              </span>
              <label htmlFor={'required' + index} className="form-control">Required</label>
            </div>
          </div>
        </div>
        {(() => {
          if (duplicatedLabel) {
            return <div className="row validation-error">
                    <div className="col-sm-4">
                      <i className="fa fa-exclamation-triangle"></i>
                      &nbsp;
                      Duplicated label
                    </div>
                  </div>;
          }
        })()}

        <div className="well well-metadata-creator">
          <div className="row">
            <div className="col-sm-4">
              <FormField model={`template.data.properties[${index}].filter`}>
                <input id={'filter' + this.props.index} type="checkbox"/>
              </FormField>
              &nbsp;
              <label htmlFor={'filter' + this.props.index} title="This property will be used for filtering the library results.
              When properties match in equal name and field type with other document types, they will be combined for filtering.">
                Use as filter
                &nbsp;
                <i className="fa fa-question-circle"></i>
              </label>
            </div>
            <div className="col-sm-8 border-bottom">
              <FilterSuggestions {...ptoperty} />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-4">
              <FormField model={`template.data.properties[${index}].showInCard`}>
                <input id={'showInCard' + this.props.index} type="checkbox"/>
              </FormField>
              &nbsp;
              <label htmlFor={'showInCard' + this.props.index}
                     title="This property will appear in the library cards as part of the basic info.">
                Show in cards
                &nbsp;
                <i className="fa fa-question-circle"></i>
              </label>
            </div>
            <div className="col-sm-8 help">
              Show this property in the library card's basic info.
            </div>
          </div>
        </div>

      </div>
    );
  }
}

FormConfigInput.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps({template}) {
  return {
    data: template.data,
    formState: template.formState
  };
}

export default connect(mapStateToProps)(FormConfigInput);
