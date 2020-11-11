import React from 'react';
import { shallow } from 'enzyme';
import { UserGroupList, UserGroupListProps } from 'app/Users/components/usergroups/UserGroupList';

describe('UserGroupList', () => {
  const group1 = { _id: 'group1Id', name: 'Group 1', members: [] };
  const defaultProps: UserGroupListProps = {
    userGroups: [group1, { _id: 'group2Id', name: 'Group 2', members: [] }],
    handleSelect: jasmine.createSpy('onClick'),
  };
  function render(args?: UserGroupListProps) {
    const props = { ...defaultProps, args };
    return shallow(
      <UserGroupList userGroups={props.userGroups} handleSelect={props.handleSelect} />
    );
  }
  describe('List of groups', () => {
    it('should list all existing groups into a table', () => {
      const component = render();
      const rows = component.find('tbody > tr');
      expect(rows.length).toBe(2);
    });
    it('should call handleSelect on click over a row', () => {
      const component = render();
      const row = component.find('tbody > tr').at(0);
      expect(row.hasClass('selected')).toBe(false);
      row.simulate('click');
      expect(defaultProps.handleSelect).toHaveBeenCalledWith(group1);
      component.update();
      const updatedRow = component.find('tbody > tr').at(0);
      expect(updatedRow.hasClass('selected')).toBe(true);
    });
  });
  describe('Add groups', () => {
    it('should open side panel with an empty creation form', () => {
      const component = render();
      const addGroupsButton = component.find('.settings-footer > button').at(0);
      addGroupsButton.simulate('click');
      expect(defaultProps.handleSelect).toHaveBeenCalledWith();
    });
  });
});