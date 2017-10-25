<template>
  <container
    title="Select 选择器"
    profile="下拉选择器。">
    <h2>何时使用</h2>
    <p>弹出一个下拉菜单给用户选择操作，用于代替原生的选择器，或者需要一个更优雅的多选器</p>
    <p>当选项少时（少于 5 项），建议直接将选项平铺，使用 Radio 是更好的选择。</p>
    <h2>代码演示</h2>
    <a-row :gutter="12" style="margin-bottom: 20px">
      <a-col :span="24">
        <code-show title="典型卡片" desc="包含标题、内容、操作区域。">
        </code-show>
      </a-col>
    </a-row>
  </container>
</template>

<script>
  import Container from '../../common/container'
  import CodeShow from '../../common/code-show'
  import ARow from '@/row'
  import ACol from '@/col'
  export default {
    components: {
      Container,
      ARow,
      ACol,
      CodeShow
    }
  }
</script>

