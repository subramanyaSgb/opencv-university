import { course } from "@/generated/content-index";
import { ContinueCard } from "@/components/home/ContinueCard";
import { CourseOutline } from "@/components/home/CourseOutline";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>{course.title}</h1>
        <p className="lede">
          Image processing and computer vision with OpenCV, from absolute zero to production level. Simple first,
          then deep.
        </p>
        <ContinueCard course={course} />
      </section>
      <div className="home-outline">
        <CourseOutline course={course} />
      </div>
    </div>
  );
}
