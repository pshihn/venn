---
layout: home-layout.njk
---

# Venny

Venny is a set of components used to show Venn/Euler Diagrams on a web page.

It is implemented as framework independent custom-elements, and the layout algorithm is based on [venn.js](https://github.com/benfred/venn.js/).

For full documentation visit this project on Github

<a class="buttonLink" href="https://github.com/pshihn/venn">Venny on Github</a>

## Let's dive in

You can import the project in your JavaScript from NPM or just source it directly in your HTML.

Let's define two sets *Apples* and *Oranges*.

<figure>
  <venn-diagram width="300" height="200">
    <venn-set name="A" label="Apples"></venn-set>
    <venn-set name="B" label="Oranges"></venn-set>
  </venn-diagram>
</figure>

```html
<script type="module" src="https://unpkg.com/venny?module"></script>

<venn-diagram>
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges"></venn-set>
</venn-diagram>
```

Now let's create an intersection of these two Sets. 

<figure>
  <venn-diagram width="300" height="200">
    <venn-set name="A" label="Apples"></venn-set>
    <venn-set name="B" label="Oranges"></venn-set>
    <venn-n sets="A B">
  </venn-diagram>
</figure>

```html
<venn-diagram>
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges"></venn-set>
  <venn-n sets="A B">
</venn-diagram>
```

But the quantity of *Apples* is double than those of *Oranges*. You can configure the size of each set. 

<figure>
  <venn-diagram width="300" height="200">
    <venn-set name="A" label="Apples" size="20"></venn-set>
    <venn-set name="B" label="Oranges" size="10"></venn-set>
    <venn-n sets="A B"></venn-n>
  </venn-diagram>
</figure>

```html
<venn-diagram>
  <venn-set name="A" label="Apples" size="20"></venn-set>
  <venn-set name="B" label="Oranges" size="10"></venn-set>
  <venn-n sets="A B"></venn-n>
</venn-diagram>
```

You can also size the intersections

<figure>
  <venn-diagram width="300" height="200">
    <venn-set name="A"></venn-set>
    <venn-set name="B"></venn-set>
    <venn-set name="C"></venn-set>
    <venn-n sets="A B C" size="1"></venn-n>
    <venn-n sets="A B" size="5"></venn-n>
    <venn-n sets="A C" size="3"></venn-n>
  </venn-diagram>
</figure>

```html
<venn-diagram width="300" height="200">
  <venn-set name="A"></venn-set>
  <venn-set name="B"></venn-set>
  <venn-set name="C"></venn-set>
  <venn-n sets="A B C" size="1"></venn-n>
  <venn-n sets="A B" size="5"></venn-n>
  <venn-n sets="A C" size="3"></venn-n>
</venn-diagram>
```

You can also style them using CSS

<figure>
  <style>
    #cssExampleDiagram {
      --venn-circle-stroke: red;
      --venn-circle-stroke-width: 3;
      --venn-circle-grapes-fill-opacity: 0;
      --venn-intersection-a-b-grapes-stroke: white;
      --venn-intersection-a-b-grapes-stroke-width: 5px;
    }
  </style>
  <venn-diagram id="cssExampleDiagram" width="300" height="200">
    <venn-set name="A"></venn-set>
    <venn-set name="B"></venn-set>
    <venn-set name="Grapes" label="Grapes"></venn-set>
    <venn-n sets="A B Grapes"></venn-n>
  </venn-diagram>
</figure>

```css
venn-diagram {
  --venn-circle-stroke: red;
  --venn-circle-stroke-width: 3;
  --venn-circle-grapes-fill-opacity: 0;
  --venn-intersection-a-b-grapes-stroke: white;
  --venn-intersection-a-b-grapes-stroke-width: 5px;
}
```

Or, Add Hover effects

<figure>
  <style>
    #eventExampleDiagram,
    #hoverExampleDiagram {
      --venn-hover-circle-fill-opacity: 0.5;
      --venn-hover-circle-stroke: #000;
      --venn-hover-circle-stroke-width: 3;
      --venn-hover-intersection-stroke: #fff;
      --venn-hover-intersection-stroke-width: 3;
    }
  </style>
  <venn-diagram id="hoverExampleDiagram" width="300" height="200">
    <venn-set name="A"></venn-set>
    <venn-set name="B"></venn-set>
    <venn-set name="C"></venn-set>
    <venn-n sets="A B C"></venn-n>
  </venn-diagram>
</figure>

Since custom-elements are just like any other node on your page, you can add event listeners like click handlers. Try clicking on this diagram.

<figure>
  <venn-diagram id="eventExampleDiagram" width="300" height="200">
    <venn-set name="Apples" label="Apples"></venn-set>
    <venn-set name="Oranges" label="Oranges"></venn-set>
    <venn-set name="Grapes"  label="Grapes"></venn-set>
    <venn-n sets="Apples Oranges" size="1"></venn-n>
    <venn-n sets="Apples Grapes" size="3"></venn-n>
  </venn-diagram>
</figure>

```js
document.querySelectorAll('venn-set').forEach((d) => {
  d.addEventListener('click', () => {
    console.log(`Clicked on ${d.name}`);
  });
});

document.querySelectorAll('venn-n').forEach((d) => {
  d.addEventListener('click', () => {
    console.log(`Clicked intersection for ${d.sets}`);
  });
});
```

While we are at it, you can configure nested sets

<figure>
<venn-diagram width="300" height="200">
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges">
    <venn-set name="C" label="Lemons">
      <venn-set name="D" label="Limes"></venn-set>
    </venn-set>
  </venn-set>
  <venn-n sets="A B" size="1" label="A+O"></venn-n>
</venn-diagram>
</figure>

```html
<venn-diagram width="300" height="200">
  <venn-set name="A" label="Apples"></venn-set>
  <venn-set name="B" label="Oranges">
    <venn-set name="C" label="Lemons">
      <venn-set name="D" label="Limes"></venn-set>
    </venn-set>
  </venn-set>
  <venn-n sets="A B" size="1" label="A+O"></venn-n>
</venn-diagram>
```

## License
[MIT License](https://github.com/pshihn/venn/blob/main/LICENSE) (c) [Preet Shihn](https://twitter.com/preetster)

<p></p>