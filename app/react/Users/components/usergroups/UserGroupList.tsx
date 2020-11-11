import React, { useState } from 'react';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

export interface UserGroupListProps {
  userGroups: UserGroupSchema[];
  handleSelect: (userGroup?: UserGroupSchema) => void;
}

const UserGroupListComponent = ({ userGroups, handleSelect }: UserGroupListProps) => {
  const [selectedId, setSelectedId] = useState();
  function selectRow(userGroup: UserGroupSchema) {
    setSelectedId(userGroup._id);
    handleSelect(userGroup);
  }
  return (
    <>
      <table className="group-list">
        <thead>
          <tr>
            <th>Group</th>
          </tr>
        </thead>
        <tbody>
          {userGroups.map((userGroup: UserGroupSchema) => (
            <tr
              className={selectedId === userGroup._id ? 'selected' : ''}
              key={userGroup._id as string}
              onClick={() => selectRow(userGroup)}
            >
              <td>{userGroup.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="settings-footer">
        <button className="btn btn-success" onClick={() => handleSelect()}>
          <Icon icon="plus" />
          <span className="btn-label">
            <Translate>Add group</Translate>
          </span>
        </button>
      </div>
    </>
  );
};

export const UserGroupList = UserGroupListComponent;