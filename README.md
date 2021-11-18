# Venny

Venny is a set of custom elements used to show Venn Diagrams on a web page. These Web Components are framework indepenedent and can easily be used with any framework or in markdown. 

Venny is based on [venn.js](https://github.com/benfred/venn.js/) which provides the algorithms to layout area proportional Venn and Euler diagrams. 

_Venny is good for area proportional diagrams with as many sets but not very good when the intersections are of more than three sets._


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

Venny components expose CSS properties to let you control the styling of the section. See more in the [Styling section](#styling).

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

### Nested Sets

When you need to show that a Set is a subset of another one, you can create an intersection expressing that, or you can define the Subset as a child of the parent Set. Venny will automatically generate the intersection of the two.

```html
<venn-diagram>
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges">
    <venn-set name="C" label="Lemons">
      <venn-set name="D" label="Limes"></venn-set>
    </venn-set>
  </venn-set>
  <venn-n sets="A B" size="1" label="A+O"></venn-n>
</venn-diagram>
```
![Screen Shot 2021-11-17 at 11 11 15 PM](https://user-images.githubusercontent.com/833927/142369233-21eb4005-fcec-4a4a-a9e1-605c8a6f565e.png)


## Styling 

Venny exposes custom CSS properties to style the diagrams. Color, opacity of the set fill, stroke colors can be specified for the normal and the `hover` states. 

### Styling Circles

**Fill Color:** A dynamic color is assigned to each circle. But this can be overriden by setting the css property `--venn-circle-[name]-fill` where name is the name of the set in lower-case. e.g. `--venn-circle-apples-fill: red;`

A corersponding property `--venn-hover-[name]-fill` can be set to change the color of the set when the user hovers over the set. 

**Fill Opacity:** By default all circles are filled with an opacity of `0.25`. Having a translucent fill easily shows the intersections between the sets. However the default value of this can be set by setting the `--venn-circle-fill-opacity` property. To change the fill opacity only of a specific set you can set the `--venn-circle-[name]-fill-opacity` property by substituting `[name]` with the name of the set in lower-case. 

Corresponding hover properties are `--venn-hover-circle-fill-opacity` and `--venn-hover-circle-[name]-fill-opacity` to change the opacity on hover. 

**Stroke:** Circles are not drawn without any stroke (outline). But circle stroke color, size can be set using following properties:

`--venn-circle-stroke` to set the color of the stroke of all circles. `--venn-circle-[name]-stroke` to set the stroke color of a specific set. 

`--venn-circle-stroke-width` to set the width of the stroke of all circles. `--venn-circle-[name]-stroke-width` to set the stroke width of a specific set. 

Replace `--venn-` with `--venn-hover-` in these styles to set these when hovered. 

### Styling Intersections

Intersection strokes can be set using `--venn-intersection-stroke` and `--venn-intersection-stroke-width` prroperties. 

To set stroke on a specific intersection specify the intersecting set names in lower case, separated by a `-`
e.g. `--venn-intersection-a-b-stroke` sets the stroke color only of the intersection of Sets A and B.

Replace `--venn-` with `--venn-hover-` in these styles to set these when hovered. 

### Styling Labels

By default labels use the same color as their corresponding sets but with full opacity. Intersection labels are black by default. 

`--venn-label-color` can be set to set the color of all labels. 

`--venn-label-[name]-color` to set the label color of a specific set or intersection. e.g `--venn-label-a-b-color` sets the label color of the intersection of sets A, B

Following properties cannot be set on a set specifc levl at the moment:

`--venn-label-size` sets the font size of the label.

`--venn-label-font-family` sets which Font you'd like to use for the labels.

`--venn-label-font-weight` sets the font weight which defaults to normal / 400. 

