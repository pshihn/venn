# Venny

Venny is a set of custom elements used to show Venn Diagrams on a web page. These Web Components are framework indepenedent and can easily be used with any framework or in markdown. 

Venny is based on [venn.js](https://github.com/benfred/venn.js/) which provides the algorithms to layout area proportional Venn and Euler diagrams. 


## Usage

In your HTML you can import the library and just use the `venn-` elements in your HTML

For example:
```html
<script type="module" src="https://unpkg.com/venny?module"></script>

<venn-diagram>
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges"></venn-set>
  <venn-n sets="A B" label="Fruit"></venn-n>
</venn-diagram>
```

will create:

![Venn diagram example](https://user-images.githubusercontent.com/833927/142365349-bd5ca46d-7c3b-41cd-98ee-94848c4f6094.png)


You can also import Venny in your JavaScript project from NPM

```
npm install venny -s
```

### Styling & Interactivity

Venny components expose CSS properties to let you control the styling of the section. See more in the [Styling section](https://roughjs.com).

Since these components are just DOM Nodes, you can add click and other handlers to them as you would add to any other node. 

### Usage Examples

More usage and examples on this website: [Venny](https://roughjs.com)

## Documentation 

Venny is a set of **three components**: `venn-diagram` is the container. `venn-set` represents a set or, visually a circle. `venn-n` describes intersection of sets. 

### venn-diagram

This is the outer-most element for any diagram. It sets the size of the diagram. The default size is `600px x 350px`. These values can be set as properties or via atttributes to the node. These properties/attributes are reactive. When set, the diagram will recalculate the sizes of the shapes. 

```html
<venn-diagram width="400" height="200">
  <venn-set name="A"></venn-set>
</venn-diagram>
```

```javascript
const vd = document.querySelector('venn-diagram');
vd.width = 400;
vd.height = 200;
```

### venn-set

This element represents a single Set. It must have a `name` property. You can also set a `label` property which gets displayed in the diagram. 

Circles corresponding to each set are sized based on the `size` property which has a numeric value. If no `size` is set, it is assumed that the set's size is `10`.

```html
<venn-diagram>
  <venn-set name="A" label="Apples" size="20"></venn-set>
  <venn-set name="B" label="Bananas" size="10"></venn-set>
</venn-diagram>
```

![Venn Diagram with differrnt sized sets](https://user-images.githubusercontent.com/833927/142366532-ed00c3c0-16f9-4f18-a10e-1c7b5bafe818.png)


### venn-n

This element represents the intersection of two or more sets. The intersecting sets are specified in the `sets` property, which is a list of *space separated* set namnes.
Like a set, the intersection can alsoe have a `label` and a `size`. The `size` property indicates how much the sets are intersecting. e.g. two sets each of size 10, can have 5 elements in the intersection or just 1.

```html
<venn-diagram>
  <venn-set name="A"></venn-set>
  <venn-set name="B"></venn-set>
  <venn-n sets="A B" size="5" label="Five"></venn-n>
</venn-diagram>

<venn-diagram>
  <venn-set name="A"></venn-set>
  <venn-set name="B"></venn-set>
  <venn-n sets="A B" size="1" label="One"></venn-n>
</venn-diagram>
```

![Screen Shot 2021-11-17 at 10 58 04 PM](https://user-images.githubusercontent.com/833927/142367366-494f134c-6a59-4e3f-a117-76577b375562.png)
![Screen Shot 2021-11-17 at 10 57 52 PM](https://user-images.githubusercontent.com/833927/142367386-fc28c2de-6ac0-4dcc-b91f-13f899ca81a2.png)


Normally when more than two sets are intersecting, you should declare all possible intersections but it is not necessary. e.g. If three sets are intersecting, you can just provide one intersection for sets `A, B, C`. Venny will automatically assume values for intersections of `A, B` `B, C` and `A, C`. 

```html
<venn-diagram>
  <venn-set name="A"></venn-set>
  <venn-set name="B"></venn-set>
  <venn-set name="C"></venn-set>
  <venn-n sets="A B C"></venn-n>
</venn-diagram>
```
![Screen Shot 2021-11-17 at 11 01 17 PM](https://user-images.githubusercontent.com/833927/142367951-bed31784-289f-42ad-9a8e-ff9e05c2d017.png)

Or you can be specific 

```html
<venn-diagram>
  <venn-set name="A"></venn-set>
  <venn-set name="B"></venn-set>
  <venn-set name="C"></venn-set>
  <venn-n sets="A B C" size="1"></venn-n>
  <venn-n sets="A B" size="5"></venn-n>
  <venn-n sets="A C" size="3"></venn-n>
</venn-diagram>
```
![Screen Shot 2021-11-17 at 11 02 07 PM](https://user-images.githubusercontent.com/833927/142368046-b808e127-c4b1-436a-b9e1-fa0ddad015d8.png)



