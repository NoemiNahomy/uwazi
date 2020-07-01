import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';

import fixtures, {
  templateId,
  templateToBeInherited,
  propertyToBeInherited,
} from './validatorFixtures';

import { safeName } from '../utils';
import { validateTemplate } from '../../../shared/types/templateSchema';

describe('template schema', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('validateTemplate', () => {
    let template: TemplateSchema;

    const makeProperty = (label: string, type: PropertySchema['type'], args: object = {}) => ({
      label,
      name: safeName(label),
      type,
      id: label,
      isCommonProperty: false,
      prioritySorting: false,
      ...args,
    });

    beforeEach(() => {
      template = {
        name: 'Test',
        commonProperties: [makeProperty('title', 'text'), makeProperty('creationDate', 'date')],
        properties: [],
      };
    });

    const testValid = async () => validateTemplate(template);

    const testInvalid = async () => {
      try {
        await validateTemplate(template);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    };

    describe('valid cases', () => {
      it('should return true if the template is valid', async () => {
        await testValid();
      });
      it('should return true if property array is empty', async () => {
        template.properties = [];
        await testValid();
      });
      it('should not throw error if updating same template with same name', async () => {
        template.name = 'DuplicateName';
        template._id = templateId.toString();
        await testValid();
      });
    });

    describe('invalid cases', () => {
      it('invalid if commonProperties is empty', async () => {
        //@ts-ignore
        template.commonProperties = [];
        await testInvalid();
      });

      it('invalid if title property does not exist', async () => {
        template.commonProperties = [makeProperty('creationDate', 'date')];
        await testInvalid();
      });

      it('invalid when property has unknown data type', async () => {
        //@ts-ignore
        template.properties.push({ name: 'test', type: 'unknown' });
        await testInvalid();
      });

      it('invalid if properties have the same generated name', async () => {
        template.properties = [];
        template.properties.push(makeProperty('my label', 'numeric'));
        template.properties.push(makeProperty('my_label', 'text', { id: 'same' }));
        template.properties.push(makeProperty('another label', 'text', { id: 'same' }));
        try {
          await validateTemplate(template);
          fail('should throw error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);
          expect(e.errors).toEqual([
            expect.objectContaining({
              message: 'duplicated property value { name: "my_label" }',
              dataPath: '.properties.name',
            }),
            expect.objectContaining({
              message: 'duplicated property value { id: "same" }',
              dataPath: '.properties.id',
            }),
          ]);
        }
      });

      it('invalid if properties and common properties have the same name', async () => {
        template.properties = [];
        template.properties.push(makeProperty('title', 'text'));
        await testInvalid();
      });

      it('invalid if select property does not have a content field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'select'));
        await testInvalid();
      });

      it('invalid if multiselect property does not have a content field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'multiselect'));
        await testInvalid();
      });

      it('invalid if relationship property does not have a relationtype field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content' }));
        await testInvalid();
      });

      it('invalid if inherited relationship properties do not specify field to inherit', async () => {
        template.properties = [];
        template.properties.push(
          makeProperty('foo', 'relationship', {
            content: 'content',
            relationType: 'rel1',
            inherit: true,
          })
        );
        await testInvalid();
      });

      it('invalid if different table with the same name already exists', async () => {
        template.name = 'DuplicateName';
        await testInvalid();
      });
    });
  });

  describe('cantDeleteInheritedProperties', () => {
    it('invalid when trying to delete an inherited property', async () => {
      const template = {
        _id: templateToBeInherited,
        name: 'changed name',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [],
      };

      try {
        await validateTemplate(template);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    });

    it("should work with ID's stored as either strings or mongo ID's", async () => {
      const template = {
        _id: templateToBeInherited,
        name: 'changed name',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          {
            _id: propertyToBeInherited.toString(),
            name: 'inherit_me',
            type: 'text',
            label: 'Inherited',
          },
          { name: 'new_one', type: 'text', label: 'New one' },
        ],
      };

      await validateTemplate(template);
      expect(template.properties.length).toBe(2);
    });
  });

  describe('when there is another template with the same property', () => {
    const errorMessage =
      'Entered label is already in use on another property with a different type or thesaurus';
    const template1 = {
      name: 'template1',
      properties: [
        {
          name: 'sharedproperty1',
          label: 'sharedProperty1',
          type: 'select',
          content: 'thesauriId2',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    };
    const template2 = {
      name: 'template2',
      properties: [
        {
          name: 'sharedproperty1',
          label: 'sharedProperty1',
          type: 'select',
          content: 'thesauriId2',
        },
        {
          name: 'sharedproperty2',
          label: 'sharedProperty2',
          type: 'select',
          content: 'thesauriId1',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    };
    const template3 = {
      name: 'template3',
      properties: [{ name: 'sharedproperty3', label: 'sharedProperty3', type: 'text' }],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    };
    const template4 = {
      name: 'template4',
      properties: [
        {
          name: 'sharedrelationship1',
          label: 'sharedRelationship1',
          type: 'relationship',
          content: 'template1',
          relationType: 'relationType2',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    };
    describe('when the property to save is of a different content', () => {
      it('should throw a validation error', async () => {
        try {
          await validateTemplate(template1);
          fail('should throw validation error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);
        }
      });

      it('should return the name of the duplicated properties', async () => {
        try {
          await validateTemplate(template2);
          fail('should throw validation error');
        } catch (e) {
          expect(e).toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({
                dataPath: '.properties.sharedproperty1',
                message: errorMessage,
              }),
              expect.objectContaining({
                dataPath: '.properties.sharedproperty2',
                message: errorMessage,
              }),
            ])
          );
        }
      });
    });

    describe('when the property is a relationship and the relation type is different', () => {
      it('should throw a validation error', async () => {
        try {
          await validateTemplate(template4);
          fail('should throw validation error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);
        }
      });
    });

    describe('when the property to save is of a different type', () => {
      it('should not save the template', async () => {
        try {
          await validateTemplate(template3);
          fail('should throw validation error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);
          expect(e).toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({
                dataPath: '.properties.sharedproperty3',
                message: errorMessage,
              }),
            ])
          );
        }
      });
    });
  });
});
