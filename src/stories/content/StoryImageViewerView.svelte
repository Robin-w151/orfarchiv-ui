<script lang="ts">
  import StoryImageViewer from '$lib/components/news/story/content/StoryImageViewer.svelte';
  import type { StoryImage } from '$lib/models/story';

  let images: Array<StoryImage> = [
    {
      src: 'https://images.pexels.com/photos/28719602/pexels-photo-28719602/free-photo-of-historic-tower-in-italian-city-at-sunset.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      alt: 'Alter Turm',
    },
    {
      src: 'https://images.pexels.com/photos/28518085/pexels-photo-28518085/free-photo-of-colorful-european-houses-with-tiled-roofs.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      alt: 'Bunte Häuser',
    },
    {
      src: 'https://www.birdzilla.com/wp-content/uploads/2023/03/Elf-Owl-1-gl.jpg',
      alt: 'Eule',
    },
    {
      src: 'https://freepngimg.com/thumb/eagle/1-eagle-png-image-with-transparency-download.png',
      alt: 'Adler',
    },
  ];
  let image: StoryImage = images[0];
</script>

<StoryImageViewer {image} {images} />
