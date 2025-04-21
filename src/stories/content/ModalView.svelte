<script lang="ts">
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';

  interface Props {
    isVisible?: boolean;
    closeOnBackdropClick?: boolean;
  }

  let { isVisible, closeOnBackdropClick }: Props = $props();

  function handleModalOpen(): void {
    isVisible = true;
  }

  function handleModalClose(): void {
    isVisible = false;
  }
</script>

<Button onclick={handleModalOpen}>Open Modal</Button>
{#if isVisible}
  <Modal
    modalClass="w-full h-full sm:h-[max(60%,36rem)]"
    label="Modal Label"
    {closeOnBackdropClick}
    onClose={handleModalClose}
  >
    <AlertBox
      title="Alert Box Title"
      message="This is a longer test message for the AlertBox component. It is intended to demonstrate how the alert box handles and displays longer content, including line breaks, additional details, and more descriptive information for the user to read and understand."
      boxPadding="p-4 sm:p-8"
    />
  </Modal>
{/if}
