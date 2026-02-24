sfl-portable-text

convert a portable text array to a structure that's closer to prosemirror's,
JSON format which is far easier to render using simple recursive traversal

example input:

    [
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
        }
    ]

corresponding output:

    [
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    content: "This is ",
                },
                {
                    type: "strong",
                    content: [
                        {
                            type: "text",
                            content: "bold text",
                        }
                    ],
                },
                {
                    type: "text",
                    content: " and ",
                },
                {
                    type: "em",
                    content: [
                        {
                            type: "text",
                            content: "italic text",
                        }
                    ],
                },
                {
                    type: "text",
                    content: ".",
                }
            ],
        }
    ]
