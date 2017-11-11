<template>
  <div class="`${prefixCls}`" style="width: 120px;">
    <div :class="classes" role="combobox" aria-autocomplete="list" aria-haspopup="true" aria-expanded="false"
         tabindex="0">

    </div>
  </div>
</template>

<script>
  import {isMultipleOrTags} from './util'
  export default {
    props: {
      prefixCls: {
        type: String,
        default: 'ant-select'
      }
    },
    computed: {
      classes () {
        return [
          `${this.prefixCls}-selection`,
          `${this.prefixCls}-selection--${this.multiple ? 'multiple' : 'single'}`
        ]
      },
      multiple () {
        return isMultipleOrTags(this.props)
      }
    }
  }
</script>

<style>

</style>
