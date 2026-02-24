import type { PTBlock, StructuredBlock } from './portable-text.ts';

import { PortableTextFormatter } from './portable-text.ts';
import { TestSuite } from './portable-text.suite.ts';

const tests = new TestSuite();

tests.run('basic blocks, lists, and marks', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'This is ',
					marks: []
				},
				{
					_type: 'span',
					_key: 'span2',
					text: 'bold text',
					marks: ['strong']
				},
				{
					_type: 'span',
					_key: 'span3',
					text: ' and ',
					marks: []
				},
				{
					_type: 'span',
					_key: 'span4',
					text: 'italic text',
					marks: ['em']
				},
				{
					_type: 'span',
					_key: 'span5',
					text: '.',
					marks: []
				}
			],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list1',
			style: 'normal',
			listItem: 'bullet',
			level: 1,
			children: [
				{
					_type: 'span',
					_key: 'span6',
					text: '1 bullet point',
					marks: []
				}
			],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list2',
			style: 'normal',
			listItem: 'bullet',
			level: 2,
			children: [
				{
					_type: 'span',
					_key: 'span7',
					text: '1a bullet point',
					marks: []
				}
			],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list3',
			style: 'normal',
			listItem: 'bullet',
			level: 1,
			children: [
				{
					_type: 'span',
					_key: 'span7',
					text: '2 bullet point',
					marks: []
				}
			],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length,  2,             'should have 2 blocks');
	tests.assert_equal(result[0].type, 'paragraph',   'first block should be paragraph');
	tests.assert_equal(result[1].type, 'bullet_list', 'second block should be bullet list');

	const paragraph_content = result[0].content as StructuredBlock[];
	tests.assert_equal(paragraph_content.length,  5,        'paragraph should have 5 spans');
	tests.assert_equal(paragraph_content[1].type, 'strong', 'second span should be bold');
	tests.assert_equal(paragraph_content[3].type, 'em',     'fourth span should be italic');
});

tests.run('basic blocks and marks + custom block', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'heading1',
			style: 'h1',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'Main Heading',
					marks: []
				}
			],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span2',
					text: 'Here is a ',
					marks: []
				},
				{
					_type: 'span',
					_key: 'span3',
					text: 'link to example',
					marks: ['link1']
				},
				{
					_type: 'span',
					_key: 'span4',
					text: ' website.',
					marks: []
				}
			],
			markDefs: [
				{
					_type: 'link',
					_key: 'link1',
					href: 'https://example.com'
				}
			]
		},
		{
			_type: 'image',
			_key: 'img1',
			asset: {
				_ref: 'image-abc123'
			},
			alt: 'Example image'
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length,  3,           'should have 3 blocks');
	tests.assert_equal(result[0].type, 'h1',        'first block should be h1 heading');
	tests.assert_equal(result[1].type, 'paragraph', 'second block should be paragraph');
	tests.assert_equal(result[2].type, 'image',     'third block should be custom image block');

	const heading_content = result[0].content as StructuredBlock[];
	tests.assert_equal(heading_content[0].type,    'text',         'heading should contain text');
	tests.assert_equal(heading_content[0].content, 'Main Heading', 'heading text should match');

	const paragraph_content = result[1].content as StructuredBlock[];
	tests.assert_equal(paragraph_content[1].type,        'link',                'should have link span');
	tests.assert_equal(paragraph_content[1].props!.href, 'https://example.com', 'link href should match');

	tests.assert_equal(result[2].content,  undefined, 'custom block should not have content');
	tests.assert_not_null(result[2].props, 'custom block should have props');
});

tests.run('three levels of nested lists', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'list1',
			style: 'normal',
			listItem: 'bullet',
			level: 1,
			children: [{ _type: 'span', _key: 'span1', text: 'Level 1', marks: [] }],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list2',
			style: 'normal',
			listItem: 'bullet',
			level: 2,
			children: [{ _type: 'span', _key: 'span2', text: 'Level 2', marks: [] }],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list3',
			style: 'normal',
			listItem: 'bullet',
			level: 3,
			children: [{ _type: 'span', _key: 'span3', text: 'Level 3', marks: [] }],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length, 1, 'should have 1 top-level list');
	tests.assert_equal(result[0].type, 'bullet_list', 'should be bullet list');

	const level1_items = result[0].content as StructuredBlock[];
	const level1_item = level1_items[0];
	const level1_content = level1_item.content as StructuredBlock[];

	tests.assert_equal(level1_content[0].content, 'Level 1', 'level 1 text should be correct');
	tests.assert_equal(level1_content[1].type, 'list_item', 'should contain list_item wrapper');

	// Navigate through the extra list_item wrapper
	const level1_wrapper = level1_content[1].content as StructuredBlock[];
	const level2_list = level1_wrapper[0];
	tests.assert_equal(level2_list.type, 'bullet_list', 'should contain nested list');

	const level2_items = (level2_list.content as StructuredBlock[])[0];
	const level2_content = level2_items.content as StructuredBlock[];

	tests.assert_equal(level2_content[0].content, 'Level 2', 'level 2 text should be correct');
	tests.assert_equal(level2_content[1].type, 'list_item', 'should contain list_item wrapper for level 3');

	// Navigate through another extra list_item wrapper
	const level2_wrapper = level2_content[1].content as StructuredBlock[];
	const level3_list = level2_wrapper[0];
	tests.assert_equal(level3_list.type, 'bullet_list', 'should contain deeply nested list');

	const level3_items = (level3_list.content as StructuredBlock[])[0];
	const level3_content = level3_items.content as StructuredBlock[];

	tests.assert_equal(level3_content[0].content, 'Level 3', 'level 3 text should be correct');
});

tests.run('mixed list types (bullet containing numbered)', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'list1',
			style: 'normal',
			listItem: 'bullet',
			level: 1,
			children: [{ _type: 'span', _key: 'span1', text: 'Bullet item', marks: [] }],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'list2',
			style: 'normal',
			listItem: 'number',
			level: 2,
			children: [{ _type: 'span', _key: 'span2', text: 'Numbered sub-item', marks: [] }],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length, 2, 'should have 2 separate lists due to different types');
	tests.assert_equal(result[0].type, 'bullet_list', 'first should be bullet list');
	tests.assert_equal(result[1].type, 'number_list', 'second should be number list');

	const bullet_items = result[0].content as StructuredBlock[];
	const bullet_item = bullet_items[0];
	const bullet_content = bullet_item.content as StructuredBlock[];

	tests.assert_equal(bullet_content[0].content, 'Bullet item', 'bullet text should be correct');

	const number_items = result[1].content as StructuredBlock[];
	const number_item = number_items[0];
	const number_content = number_item.content as StructuredBlock[];

	tests.assert_equal(number_content[0].content, 'Numbered sub-item', 'numbered text should be correct');
});

tests.run('empty list handling', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'list1',
			style: 'normal',
			listItem: 'bullet',
			level: 1,
			children: [{ _type: 'span', _key: 'span1', text: '', marks: [] }],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length, 0, 'empty list should be filtered out by default');
});

tests.run('equal marks in different order', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'bold and italic text',
					marks: ['strong', 'em']
				},
				{
					_type: 'span',
					_key: 'span2',
					text: 'italic and bold text',
					marks: ['em', 'strong']
				}
			],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	const paragraph_content = result[0].content as StructuredBlock[];
	const first_span = paragraph_content[0];
	const second_span = paragraph_content[1];

	// both spans should now have consistent ordering: strong outer, em inner
	tests.assert_equal(first_span.type, 'strong', 'first span outer mark should be strong');
	tests.assert_equal(second_span.type, 'strong', 'second span outer mark should be strong');

	const first_inner = first_span.content as StructuredBlock[];
	const second_inner = second_span.content as StructuredBlock[];

	tests.assert_equal(first_inner[0].type, 'em', 'first span inner mark should be em');
	tests.assert_equal(second_inner[0].type, 'em', 'second span inner mark should be em');
});

tests.run('multiple marks on same span', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'bold and italic text',
					marks: ['strong', 'em']
				}
			],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	const paragraph_content = result[0].content as StructuredBlock[];
	const outer_mark = paragraph_content[0];
	const inner_mark = outer_mark.content as StructuredBlock[];

	tests.assert_equal(outer_mark.type, 'strong', 'outer mark should be strong');
	tests.assert_equal(inner_mark[0].type, 'em', 'inner mark should be em');
	tests.assert_equal((inner_mark[0].content as StructuredBlock[])[0].content, 'bold and italic text', 'text should be nested correctly');
});

tests.run('custom marks with complex markDefs', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'annotated text',
					marks: ['annotation1']
				}
			],
			markDefs: [
				{
					_type: 'annotation',
					_key: 'annotation1',
					note: 'This is a footnote',
					author: 'John Doe',
					date: '2024-01-01'
				}
			]
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	const paragraph_content = result[0].content as StructuredBlock[];
	const marked_span = paragraph_content[0];

	tests.assert_equal(marked_span.type, 'annotation', 'should use markDef type');
	tests.assert_equal(marked_span.props!.note, 'This is a footnote', 'should preserve note prop');
	tests.assert_equal(marked_span.props!.author, 'John Doe', 'should preserve author prop');
	tests.assert_equal(marked_span.props!.date, '2024-01-01', 'should preserve date prop');
	tests.assert_equal(marked_span.props!._key, undefined, 'should not include _key in props');
	tests.assert_equal(marked_span.props!._type, undefined, 'should not include _type in props');
});

tests.run('different block styles', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'h1',
			style: 'h1',
			children: [{ _type: 'span', _key: 'span1', text: 'Heading 1', marks: [] }],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'h2',
			style: 'h2',
			children: [{ _type: 'span', _key: 'span2', text: 'Heading 2', marks: [] }],
			markDefs: []
		},
		{
			_type: 'block',
			_key: 'quote',
			style: 'blockquote',
			children: [{ _type: 'span', _key: 'span3', text: 'Quote text', marks: [] }],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length, 3, 'should have 3 blocks');
	tests.assert_equal(result[0].type, 'h1', 'first should be h1');
	tests.assert_equal(result[1].type, 'h2', 'second should be h2');
	tests.assert_equal(result[2].type, 'blockquote', 'third should be blockquote');

	tests.assert_equal((result[0].content as StructuredBlock[])[0].content, 'Heading 1', 'h1 text correct');
	tests.assert_equal((result[1].content as StructuredBlock[])[0].content, 'Heading 2', 'h2 text correct');
	tests.assert_equal((result[2].content as StructuredBlock[])[0].content, 'Quote text', 'quote text correct');
});

tests.run('empty spans handling', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{ _type: 'span', _key: 'span1', text: 'Start ', marks: [] },
				{ _type: 'span', _key: 'span2', text: '', marks: ['strong'] },
				{ _type: 'span', _key: 'span3', text: ' End', marks: [] }
			],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	const paragraph_content = result[0].content as StructuredBlock[];

	tests.assert_equal(paragraph_content.length, 3, 'should preserve all spans including empty ones');
	tests.assert_equal(paragraph_content[0].content, 'Start ', 'first span text correct');
	tests.assert_equal(paragraph_content[1].type, 'strong', 'empty span should still have mark');
	tests.assert_equal((paragraph_content[1].content as StructuredBlock[])[0].content, '', 'empty span text should be empty string');
	tests.assert_equal(paragraph_content[2].content, ' End', 'last span text correct');
});

tests.run('missing level defaults to 1', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'list1',
			style: 'normal',
			listItem: 'bullet',
			children: [{ _type: 'span', _key: 'span1', text: 'No level specified', marks: [] }],
			markDefs: []
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	tests.assert_equal(result.length, 1, 'should have 1 list');
	tests.assert_equal(result[0].type, 'bullet_list', 'should be bullet list');

	const list_items = result[0].content as StructuredBlock[];
	tests.assert_equal(list_items.length, 1, 'should have 1 item');
});

tests.run('mark optimization with shared marks across adjacent spans', () => {
	const input: PTBlock[] = [
		{
			_type: 'block',
			_key: 'para1',
			style: 'normal',
			children: [
				{
					_type: 'span',
					_key: 'span1',
					text: 'This text is ',
					marks: ['strong']
				},
				{
					_type: 'span',
					_key: 'span2',
					text: 'bold and linked',
					marks: ['strong', 'link1']
				},
				{
					_type: 'span',
					_key: 'span3',
					text: ' and continues bold',
					marks: ['strong']
				}
			],
			markDefs: [
				{
					_type: 'link',
					_key: 'link1',
					href: 'https://example.com'
				}
			]
		}
	];

	const formatter = new PortableTextFormatter();
	const result = formatter.format(input as PTBlock[]);

	const paragraph_content = result[0].content as StructuredBlock[];

	// strong should be outer mark since it spans 3 adjacent spans, link should be inner
	tests.assert_equal(paragraph_content[1].type, 'strong', 'shared mark should be outer');
	const inner_content = paragraph_content[1].content as StructuredBlock[];
	tests.assert_equal(inner_content[0].type, 'link', 'less frequent mark should be inner');
	tests.assert_equal(inner_content[0].props!.href, 'https://example.com', 'link props should be preserved');
});

tests.print_results();
